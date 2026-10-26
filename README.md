# MiliMoradiya55-NeuroTwin-AI-AI-Based-Neurological-Health-Monitoring-System
NeuroTwin AI is a clinical-grade digital twin platform that analyzes 5 multimodal assessments (Voice, Tremor, Typing, Face, Memory) using XGBoost, SHAP, and Gemini LLM to detect early Parkinson's disease. Built with React, TypeScript, FastAPI, and Python, it provides real-time explainable AI and a unified patient dashboard.
<div align="center">

# 🧠 NeuroTwin AI
### AI-Based Neurological Health Monitoring & Clinical Digital Twin System

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**NeuroTwin AI** is an advanced, clinical-grade digital twin platform designed to construct a real-time digital replica of a patient's neurological health. By analyzing 5 multimodal assessments (Voice, Tremor, Typing, Face, and Memory) using Machine Learning (XGBoost, Random Forest), Explainable AI (SHAP), and Generative AI (Google Gemini), it detects early signs of Parkinson's disease years before clinical symptoms appear.

[Explore the Architecture](#-system-architecture) · [Report Bug](https://github.com/MiliMoradiya55/NeuroTwin-AI/issues) · [Request Feature](https://github.com/MiliMoradiya55/NeuroTwin-AI/issues)

</div>

---

## 📖 Table of Contents

1. [Introduction](#-introduction)
2. [The Clinical Problem](#-the-clinical-problem)
3. [Core Features](#-core-features)
4. [System Architecture](#-system-architecture)
5. [Technology Stack](#-technology-stack)
6. [AI & ML Pipeline (The Brain)](#-ai--ml-pipeline-the-brain)
7. [Database Schema](#-database-schema)
8. [Project Directory Structure](#-project-directory-structure)
9. [Installation & Setup Guide](#-installation--setup-guide)
10. [Environment Variables (`.env`)](#-environment-variables-env)
11. [REST API Documentation](#-rest-api-documentation)
12. [Frontend Walkthrough](#-frontend-walkthrough)
13. [Security & Privacy](#-security--privacy)
14. [Future Scope](#-future-scope)
15. [Contributors](#-contributors)

---

## 🚀 Introduction

Parkinson's disease (PD) is a progressive nervous system disorder that affects movement, speech, and cognition. Currently, by the time motor symptoms (like tremors) become visible, nearly 60-80% of dopamine-producing neurons are already lost. 

**NeuroTwin AI** acts as an early-warning system. It creates a **Digital Twin**—a virtual, multi-dimensional model of the patient's neurological baseline. Through weekly 2-minute assessments, the platform tracks longitudinal micro-changes in voice, motor control, and cognition, utilizing Deep Learning and Clinical AI to provide **Explainable Insights** to patients.

---

## 🔬 The Clinical Problem

- **Late Diagnosis:** PD is often diagnosed years after onset.
- **Subjective Testing:** Traditional assessments rely on subjective clinical observation.
- **Lack of Longitudinal Data:** Patients are evaluated only during sporadic clinic visits.
- **Black-Box AI:** Existing AI models cannot explain *why* they flagged a patient, reducing clinical trust.

**Our Solution:** A transparent, multimodal AI platform that patients can use from home, backed by Explainable AI (SHAP) and Generative AI (Gemini) for clear clinical context.

---

## ✨ Core Features

### 1. Five Diagnostic Modules (Multimodal)
- **🎤 Voice Analysis:** Extracts acoustic biomarkers (Jitter, Shimmer, HNR) from sustained vowel phonation using FFmpeg and Librosa.
- **✋ Hand Tremor:** Analyzes video frames to detect motor instability and resting tremors via computer vision.
- **⌨️ Typing Pattern:** Monitors keystroke latency, rhythm variance, and error rates.
- **👁️ Facial Expression:** Detects micro-expressions and facial asymmetry (masked facies) using MediaPipe.
- **🧠 Memory Recall:** Evaluates working memory and cognitive recall accuracy.

### 2. Explainable AI (XAI)
- Integrated with **SHAP (SHapley Additive exPlanations)**.
- Shows exactly *why* the AI made a prediction. (e.g., "Elevated voice jitter contributed +15% to the risk score").

### 3. AI Health Assistant (GenAI)
- Powered by **Google Gemini LLM**.
- Translates complex neurological metrics and SHAP values into empathetic, easy-to-understand health advice for the patient.

### 4. Unified Patient Dashboard
- Beautiful, interactive charts (Chart.js).
- Timeline view for weekly, monthly, and yearly progress tracking.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    %% Styling
    classDef client fill:#EFF6FF,stroke:#3B82F6,stroke-width:2px,stroke-dasharray: 5 5
    classDef server fill:#F0FDF4,stroke:#22C55E,stroke-width:2px,stroke-dasharray: 5 5
    classDef db fill:#FEF2F2,stroke:#EF4444,stroke-width:2px,stroke-dasharray: 5 5
    
    subgraph Client ["📱 Client (Patient Device)"]
        UI["💻 React + TypeScript + Tailwind"]:::client
    end

    NET{{"🌐 REST API Gateway (HTTPS + JWT)"}}

    subgraph Server ["⚙️ Server Environment (FastAPI)"]
        direction TB
        B1["🔐 Auth Service"]
        B2["📡 Assessment Service"]:::server
        
        subgraph AI ["🧬 Intelligence Layer (AI/ML)"]
            M1["Voice, Tremor, Typing, Face, Memory"]
            ML["📈 XGBoost & RF Classifiers"]
            XAI["🔍 SHAP (Explainability)"]
            LLM["🤖 Google Gemini (Clinical LLM)"]
            M1 ==> ML ==> XAI ==> LLM
        end
        
        B2 ==> M1
        LLM ==> B2
    end

    subgraph Database ["🗄️ Data Storage"]
        DB[("SQLite Database")]:::db
    end

    UI ==>|1. Sends Data| NET
    NET ==>|2. Routes| Server
    Server <-->|3. Read/Write| Database
