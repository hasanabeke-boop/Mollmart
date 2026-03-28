# Mollmart

**Mollmart** is a web-based reverse auction marketplace platform where buyers create structured purchase requests and sellers compete by submitting offers.  
Unlike traditional fixed-price marketplaces, Mollmart shifts the interaction model from seller-first listing publication to buyer-first demand creation.

The project is being developed as a realistic, modular software engineering solution with a web frontend, microservice-based backend, PostgreSQL as the primary database, Redis for caching and realtime support, and Cloudflare Tunnel for secure public demonstration access from a locally hosted machine.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Business Concept](#business-concept)
- [Goals and Scope](#goals-and-scope)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Microservices Overview](#microservices-overview)
- [Main User Roles](#main-user-roles)
- [Core Business Flow](#core-business-flow)
- [MVP Scope](#mvp-scope)
- [Non-Functional Requirements](#non-functional-requirements)
- [Deployment Model](#deployment-model)
- [Environment Variables](#environment-variables)
- [Local Development Setup](#local-development-setup)
- [Running with Docker](#running-with-docker)
- [API Gateway](#api-gateway)
- [Database and Prisma](#database-and-prisma)
- [Authentication and Authorization](#authentication-and-authorization)
- [Realtime and Notifications](#realtime-and-notifications)
- [Testing Strategy](#testing-strategy)
- [Logging and Monitoring](#logging-and-monitoring)
- [Security Considerations](#security-considerations)
- [Future Improvements](#future-improvements)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)
- [Authors](#authors)
- [License](#license)

---

## Project Overview

Mollmart is a reverse auction marketplace designed for situations where a buyer wants to describe a need and receive competitive offers from multiple sellers.

Instead of browsing only static product listings, the buyer creates a request that includes relevant details such as product description, budget range, delivery expectations, and optional preferences. Sellers then browse available buyer requests and submit their own offers. The buyer compares these offers and can continue communication through contextual chat before accepting one option.

The project is intended to demonstrate:
- practical marketplace system design;
- modular backend architecture;
- realistic deployment strategy;
- clear separation of concerns between frontend, services, data, and infrastructure.

Mollmart is currently focused on a **web-first MVP** with a **simple but scalable architecture** that can be demonstrated locally and extended later.

---

## Business Concept

Traditional marketplaces usually follow a seller-driven model:
1. the seller publishes a listing;
2. the buyer searches among many offers;
3. the buyer compares price, quality, trust, and delivery conditions manually.

Mollmart inverts this flow:
1. the buyer creates a structured request;
2. multiple sellers respond with offers;
3. the buyer compares responses in one place.

This approach is particularly useful when:
- multiple sellers can provide similar products or services;
- price is flexible;
- buyers want to save time on comparison;
- small sellers need access to direct buyer intent without paying heavily for visibility.

---

## Goals and Scope

### Main Goal

The main goal of Mollmart is to design and implement a realistic reverse auction marketplace platform that supports the complete interaction cycle between buyers and sellers in a structured digital environment.

### Specific Goals

- provide a buyer-first request creation flow;
- support competitive seller offer submission;
- enable direct buyer-seller communication through chat;
- maintain a modular and understandable microservice architecture;
- use a realistic deployment model suitable for a student team and local hosting;
- preserve room for future extension without overengineering the current stage.

---

## Core Features

### Buyer Features
- registration and login;
- buyer profile management;
- create structured requests;
- save request drafts;
- publish requests;
- view request status and history;
- view received offers;
- compare seller offers;
- communicate with sellers through chat;
- accept one offer and close the request.

### Seller Features
- registration and login;
- seller profile creation;
- browse published buyer requests;
- filter and search available requests;
- submit offers;
- update or withdraw offers;
- communicate with buyers through chat;
- track accepted or rejected offers.

### Admin Features
- manage categories;
- review flagged or suspicious content;
- block or unblock users;
- hide inappropriate marketplace content;
- review simple platform summary metrics.

---

## System Architecture

Mollmart follows a modular architecture with a separate frontend and multiple backend services.

### High-Level Components

- **Frontend**
  - Next.js 14 web application
  - App Router
  - TypeScript

- **Backend**
  - Node.js + Express.js microservices
  - TypeScript
  - REST-based communication

- **Data Layer**
  - PostgreSQL as the main relational database
  - Redis for caching, pub/sub, and realtime support

- **Gateway**
  - Kong API Gateway for routing and centralized entry point

- **Deployment**
  - local machine hosting
  - secure public exposure through Cloudflare Tunnel

### Architectural Principles

- keep the current implementation realistic and runnable on one machine;
- separate responsibilities by domain, not by random folder mood;
- use synchronous REST communication first;
- add complexity only when justified by actual need;
- keep future scaling possible without pretending the current version is already cloud-native at enterprise scale.

---

## Technology Stack

### Frontend
- Next.js 14
- React
- TypeScript

### Backend
- Node.js
- Express.js
- TypeScript

### Database
- PostgreSQL
- Prisma ORM

### Cache / Realtime
- Redis

### Gateway / Networking
- Kong API Gateway
- Cloudflare Tunnel

### Containerization
- Docker
- Docker Compose

### Development Tools
- npm or yarn
- Prisma CLI
- VS Code
- Git and GitHub

---

## Project Structure

Example project structure:

```text
mollmart/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── services/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── services/
│   │   ├── auth-service/
│   │   ├── profile-service/
│   │   ├── request-service/
│   │   ├── offer-service/
│   │   ├── chat-service/
│   │   ├── admin-service/
│   │   └── notification-service/
│   │
│   ├── packages/
│   │   └── shared/
│   │
│   ├── docs/
│   ├── docker-compose.yml
│   ├── package.json
│   ├── .env
│   └── .env.example
│
├── README.md
└── ...