# Backend/populate_assessments_complete.py

"""
Complete script to populate the assessments table from ALL module assessment tables.
This script will:
1. Fetch all assessments from voice, tremor, memory, typing, face tables
2. Group them by user and date
3. Create combined assessments in the assessments table
4. Calculate brain health scores from all modules
5. Handle missing data gracefully
"""

import os
import sys
from datetime import datetime
from collections import defaultdict
from sqlalchemy.orm import Session
from sqlalchemy import func

# Add the current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.assessment import Assessment
from app.models.user import User
from app.models.twin import DigitalTwin
from app.models.voice import VoiceAssessment
from app.models.tremor import TremorAssessment
from app.models.memory import MemoryAssessment
from app.models.typing import TypingAssessment
from app.models.face import FaceAssessment


def get_module_assessments(db: Session, user_id: int):
    """Get all module assessments for a user"""
    voice_assessments = db.query(VoiceAssessment).filter(
        VoiceAssessment.user_id == user_id
    ).all()
    
    tremor_assessments = db.query(TremorAssessment).filter(
        TremorAssessment.user_id == user_id
    ).all()
    
    memory_assessments = db.query(MemoryAssessment).filter(
        MemoryAssessment.user_id == user_id
    ).all()
    
    typing_assessments = db.query(TypingAssessment).filter(
        TypingAssessment.user_id == user_id
    ).all()
    
    face_assessments = db.query(FaceAssessment).filter(
        FaceAssessment.user_id == user_id
    ).all()
    
    return {
        'voice': voice_assessments,
        'tremor': tremor_assessments,
        'memory': memory_assessments,
        'typing': typing_assessments,
        'face': face_assessments
    }


def group_assessments_by_date(module_data):
    """
    Group all module assessments by date.
    Returns dict: {date: {'voice': score, 'memory': score, ...}}
    """
    date_groups = defaultdict(lambda: {
        'voice': 0,
        'tremor': 0,
        'memory': 0,
        'typing': 0,
        'face': 0,
        'counts': {
            'voice': 0,
            'tremor': 0,
            'memory': 0,
            'typing': 0,
            'face': 0
        }
    })
    
    # Process each module type
    for module_type, assessments in module_data.items():
        for assessment in assessments:
            if assessment.completed_at:
                date_key = assessment.completed_at.date()
                
                # Get the score (handle different attribute names)
                score = 0
                if hasattr(assessment, 'score'):
                    score = assessment.score or 0
                elif hasattr(assessment, 'accuracy'):
                    score = assessment.accuracy or 0
                elif hasattr(assessment, 'brain_health_score'):
                    score = assessment.brain_health_score or 0
                
                # Update the group with the highest score for that module on that date
                if score > date_groups[date_key][module_type]:
                    date_groups[date_key][module_type] = score
                    date_groups[date_key]['counts'][module_type] += 1
    
    # Convert to sorted list
    sorted_dates = sorted(date_groups.keys())
    result = []
    
    for date in sorted_dates:
        data = date_groups[date]
        # Only include if at least one module has a score
        if any(data[module] > 0 for module in ['voice', 'tremor', 'memory', 'typing', 'face']):
            result.append({
                'date': date,
                'voice': data['voice'],
                'tremor': data['tremor'],
                'memory': data['memory'],
                'typing': data['typing'],
                'face': data['face'],
                'counts': data['counts']
            })
    
    return result


def calculate_brain_health_score(scores):
    """Calculate brain health score from module scores (average of valid scores)"""
    valid_scores = [s for s in scores if s > 0]
    if not valid_scores:
        return 0
    return round(sum(valid_scores) / len(valid_scores), 1)


def get_or_create_twin(db: Session, user_id: int):
    """Get or create digital twin for user"""
    twin = db.query(DigitalTwin).filter(DigitalTwin.user_id == user_id).first()
    if not twin:
        twin = DigitalTwin(
            user_id=user_id,
            name=f"Twin_{user_id}",
            is_active=True,
            baseline_created_at=datetime.utcnow()
        )
        db.add(twin)
        db.commit()
        db.refresh(twin)
    return twin


def populate_assessments_table(db: Session, user_id: int = None):
    """
    Main function to populate assessments table
    If user_id is None, process all users
    """
    # Get users
    if user_id:
        users = db.query(User).filter(User.id == user_id).all()
    else:
        users = db.query(User).all()
    
    total_created = 0
    total_users = len(users)
    
    print("=" * 70)
    print("📊 POPULATING ASSESSMENTS TABLE FROM ALL MODULE TABLES")
    print("=" * 70)
    
    for user_idx, user in enumerate(users):
        print(f"\n👤 [{user_idx + 1}/{total_users}] Processing user: {user.id} - {user.name}")
        
        # Get all module assessments for this user
        module_data = get_module_assessments(db, user.id)
        
        # Check if user has any assessments
        total_assessments = sum(len(assessments) for assessments in module_data.values())
        
        if total_assessments == 0:
            print(f"  ⚠️ No module assessments found for user {user.id}")
            continue
        
        print(f"  📊 Found {total_assessments} module assessments:")
        print(f"     Voice: {len(module_data['voice'])}")
        print(f"     Tremor: {len(module_data['tremor'])}")
        print(f"     Memory: {len(module_data['memory'])}")
        print(f"     Typing: {len(module_data['typing'])}")
        print(f"     Face: {len(module_data['face'])}")
        
        # Group assessments by date
        grouped = group_assessments_by_date(module_data)
        
        if not grouped:
            print(f"  ⚠️ No valid module assessments found for user {user.id}")
            continue
        
        print(f"  📅 Grouped into {len(grouped)} dates")
        
        # Get or create twin
        twin = get_or_create_twin(db, user.id)
        
        # Delete existing combined assessments for this user (optional)
        existing = db.query(Assessment).filter(Assessment.user_id == user.id).all()
        if existing:
            print(f"  🗑️ Deleting {len(existing)} existing combined assessments")
            for a in existing:
                db.delete(a)
            db.commit()
        
        created_count = 0
        previous_score = 0
        
        # Create combined assessment for each date
        for idx, day_data in enumerate(grouped):
            date = day_data['date']
            
            # Get module scores
            voice_score = day_data['voice']
            tremor_score = day_data['tremor']
            memory_score = day_data['memory']
            typing_score = day_data['typing']
            face_score = day_data['face']
            
            scores = [voice_score, tremor_score, memory_score, typing_score, face_score]
            brain_health_score = calculate_brain_health_score(scores)
            
            # Calculate change from previous
            change = brain_health_score - previous_score if previous_score > 0 else 0
            
            # Create combined assessment
            assessment = Assessment(
                user_id=user.id,
                twin_id=twin.id,
                voice_score=voice_score,
                tremor_score=tremor_score,
                memory_score=memory_score,
                typing_score=typing_score,
                face_score=face_score,
                brain_health_score=brain_health_score,
                previous_score=previous_score,
                change=round(change, 1),
                week_number=date.isocalendar()[1],
                status="completed",
                completed_at=datetime.combine(date, datetime.min.time())
            )
            
            db.add(assessment)
            created_count += 1
            previous_score = brain_health_score
            
            # Show progress
            if created_count % 10 == 0:
                print(f"     Created {created_count} assessments...")
        
        db.commit()
        total_created += created_count
        print(f"  ✅ Created {created_count} combined assessments for user {user.id}")
    
    print("\n" + "=" * 70)
    print(f"✅ COMPLETE! Created {total_created} combined assessments")
    print("=" * 70)
    
    return total_created


def show_summary(db: Session):
    """Show summary of assessments table"""
    total = db.query(Assessment).count()
    users_with_assessments = db.query(Assessment.user_id).distinct().count()
    
    print("\n📊 SUMMARY")
    print("-" * 40)
    print(f"Total assessments in table: {total}")
    print(f"Users with assessments: {users_with_assessments}")
    
    if total > 0:
        # Show sample
        sample = db.query(Assessment).limit(5).all()
        print("\n📋 Sample assessments:")
        for a in sample:
            print(f"  ID: {a.id}, User: {a.user_id}, Score: {a.brain_health_score}, Date: {a.completed_at.date()}")


if __name__ == "__main__":
    db = SessionLocal()
    
    try:
        # Run the population
        total_created = populate_assessments_table(db)
        
        # Show summary
        show_summary(db)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()