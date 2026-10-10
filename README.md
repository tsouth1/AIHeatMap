# AIHeatMap
PRD:
# Product Requirements Document (PRD)
# AI Ecosystem Navigator

**Version:** 1.0  
**Document Owner:** Product Team  
**Target Audience:** Engineering Teams, AI Coding Agents, Architects, UX Designers, Investors  
**Project Type:** SaaS Platform  
**Architecture Style:** Microservice-Ready Modular Monolith (MVP) → Service-Oriented Architecture (Scale)

---

# Executive Summary

AI Ecosystem Navigator is an interactive knowledge graph platform that helps users understand the rapidly evolving Artificial Intelligence landscape.

Unlike a traditional glossary, AI Ecosystem Navigator presents AI concepts, technologies, acronyms, frameworks, companies, research topics, and trends within a connected ecosystem.

The platform enables users to:

- Explore AI concepts visually
- Understand concept relationships
- Discover trusted learning resources
- Monitor AI trends
- Build personalized learning paths
- Track emerging technologies
- Navigate the AI ecosystem through interactive visualizations

---

# Business Goals

## Primary Goals

### Goal 1

Reduce AI knowledge barriers for beginners.

### Goal 2

Provide trusted AI education pathways.

### Goal 3

Create a central AI knowledge discovery platform.

### Goal 4

Monetize trend intelligence and premium learning tools.

### Goal 5

Become the "Bloomberg Terminal for AI Knowledge."

---

# Target Users

## Persona 1: Curious Beginner

### Profile

- Little AI experience
- Watches YouTube
- Reads blogs
- Frequently encounters unfamiliar terminology

### Needs

- Definitions
- Learning pathways
- Beginner-friendly resources

---

## Persona 2: Business Executive

### Profile

- Non-technical
- Hears AI terminology in meetings

### Needs

- Plain language explanations
- Business implications
- Market relevance

---

## Persona 3: Developer

### Profile

- Technical background
- Familiar with software engineering

### Needs

- Relationship mapping
- Technical documentation
- Open source projects

---

## Persona 4: Researcher

### Profile

- Academic or industry researcher

### Needs

- Research links
- Citation networks
- Trend visualization

---

# MVP Scope

## Included

### Interactive Knowledge Graph

Visual graph of AI concepts.

### Concept Pages

Definitions and contextual information.

### Relationship Mapping

Visual connections between concepts.

### Resource Discovery

External references and educational resources.

### Search

Global semantic search.

### Learning Paths

Auto-generated educational journeys.

---

## Excluded (MVP)

- 3D visualization
- Forecasting engine
- Enterprise dashboards
- Custom organizational taxonomies
- Team collaboration features

---

# Functional Requirements

## FR-001 Ecosystem Visualization

### Description

Display AI concepts as nodes.

### Acceptance Criteria

- Node clustering enabled
- Node dragging supported
- Zoom and pan enabled
- Mobile compatible

### Priority

P0

---

## FR-002 Relationship Engine

### Description

Connect related concepts.

### Relationship Types

```json
[
  "related_to",
  "depends_on",
  "part_of",
  "alternative_to",
  "uses",
  "extends"
]
```

### Priority

P0

---

## FR-003 Concept Detail Panel

### Description

Clicking nodes opens sidebar.

### Information Displayed

- Definition
- Summary
- Popularity score
- Maturity score
- Related concepts

### Priority

P0

---

## FR-004 Resource Explorer

### Description

Show learning resources.

### Resource Types

- Papers
- GitHub Repositories
- Videos
- Documentation
- Courses
- News

### Priority

P0

---

## FR-005 Search

### Description

Search any concept.

### Examples

```text
MCP
Agents
LoRA
Fine Tuning
Vector Database
```

### Expected Result

Focus graph on concept.

### Priority

P0

---

## FR-006 Learning Path Generation

### Description

Generate concept dependency chain.

### Example

```text
LLM Fundamentals
→ Tokenization
→ Embeddings
→ Vector Databases
→ RAG
→ AI Agents
→ MCP
```

### Priority

P1

---

# Premium Feature Requirements

## PF-001 Trend Intelligence

### Description

Track mention frequency over time.

### Data Sources

- Google Trends
- GitHub Activity
- Reddit Mentions
- Research Citations
- YouTube Content

---

## PF-002 Historical Timeline

Interactive AI history explorer.

---

## PF-003 Galaxy Mode

3D visualization environment.

---

## PF-004 Personalized Roadmaps

User-specific learning tracks.

---

## PF-005 Credibility Engine

Score every source.

Example:

```text
ArXiv         92
MIT           98
Vendor Blog   75
Reddit        40
```

---

# User Stories

## US-001

As a beginner

I want to click on MCP

So that I can understand what it means.

---

## US-002

As a user

I want to see concepts related to MCP

So that I understand its context.

---

## US-003

As a developer

I want to filter only GitHub resources

So that I can find code examples.

---

## US-004

As a researcher

I want to view peer-reviewed publications

So that I can evaluate credibility.

---

## US-005

As a business leader

I want trend indicators

So that I understand market importance.

---

# UI / UX Requirements

---

# Main Layout

```text
+---------------------------------------------------+
| Header                                            |
+---------------------------------------------------+
| Search                                            |
+---------------------------------------------------+
|                                                    |
| Knowledge Graph Visualization                      |
|                                                    |
+-------------------+-------------------------------+
| Sidebar           | Resource Explorer              |
|                   |                               |
| Selected Node     | Research Links                |
| Definition        | Videos                        |
| Related Concepts  | GitHub                        |
| Trend Score       | Courses                       |
+-------------------+-------------------------------+
```

---

# Component Architecture

## Components

```text


├── Header
├── SearchBar
├── GraphCanvas
├── NodeDetailsPanel
├── ResourcePanel
├── FilterPanel
├── TrendPanel
├── LearningPathPanel
├── TimelinePanel
└── Footer
```

---

# Technical Architecture

## Frontend

### Language

```text
TypeScript
```

### Framework

```text
Next.js 15+
React 19+
```

### Styling

```text
TailwindCSS
ShadCN/UI
Framer Motion
```

### State Management

```text
Zustand
TanStack Query
```

---

# Visualization Stack

## Graph

```text
D3.js
```

## Flow Diagrams

```text
React Flow
```

## Analytics

```text
Apache ECharts
```

## Premium 3D

```text
Three.js
React Three Fiber
```

---

# Backend Architecture

## Language

```text
TypeScript
```

## Framework

```text
NestJS
```

### Modules

```text
Auth Module
User Module
Graph Module
Concept Module
Search Module
Trend Module
Learning Module
Resource Module
Admin Module
```

---

# Database Design

## PostgreSQL Schema

### Users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  subscription_tier TEXT,
  created_at TIMESTAMP
);
```

---

### Saved Concepts

```sql
CREATE TABLE saved_concepts (
  id UUID PRIMARY KEY,
  user_id UUID,
  concept_id UUID,
  created_at TIMESTAMP
);
```

---

### Learning Progress

```sql
CREATE TABLE learning_progress (
  id UUID PRIMARY KEY,
  user_id UUID,
  path_id UUID,
  progress_percentage INT
);
```

---

# Neo4j Knowledge Graph

## Concept Node

```json
{
  "id":"concept_001",
  "name":"MCP",
  "category":"protocol",
  "popularity":97,
  "maturity":"emerging"
}
```

---

## Relationship

```cypher
(MCP)-[:USES]->(TOOLS)

(MCP)-[:RELATED_TO]->(AGENTS)

(RAG)-[:REQUIRES]->(VECTOR_DATABASE)
```

---

# Search Architecture

## Search Engine

```text
OpenSearch
```

## Indexed Entities

### Concepts

```json
{
  "name":"MCP",
  "aliases":["Model Context Protocol"],
  "description":"..."
}
```

### Resources

```json
{
  "title":"Understanding MCP",
  "type":"video",
  "provider":"YouTube"
}
```

---

# API Specification

## Base URL

```text
/api/v1
```

---

# Concepts API

## Get Concepts

```http
GET /concepts
```

Response

```json
[
  {
    "id":"1",
    "name":"MCP",
    "popularity":97
  }
]
```

---

## Get Concept

```http
GET /concepts/:id
```

Response

```json
{
  "id":"1",
  "name":"MCP",
  "description":"...",
  "related":["Agents","Tools"]
}
```

---

# Relationships API

```http
GET /relationships/:conceptId
```

Response

```json
[
  {
    "source":"MCP",
    "target":"Agents",
    "weight":0.95
  }
]
```

---

# Resources API

## Retrieve Resources

```http
GET /resources
```

Query Parameters

```text
concept=
type=
difficulty=
date=
freeOnly=
```

---

# Learning Paths API

## Generate Path

```http
POST /learning-paths
```

Request

```json
{
  "concept":"MCP",
  "experience":"beginner"
}
```

---

# Authentication API

```http
POST /auth/login
POST /auth/logout
POST /auth/register
```

---

# AI Layer

## LLM Tasks

### Concept Definition Generation

```text
Input:
MCP

Output:
Definition
Importance
Use Cases
```

---

### Learning Path Construction

Analyze graph dependencies.

Generate prerequisite tree.

---

### Relationship Discovery

Identify connected technologies.

Example:

```text
RAG
Embeddings
Vector Database
Retrieval
```

---

# Non-Functional Requirements

## Performance

### Graph Load

Target:

```text
< 2 seconds
```

---

### Search Response

Target:

```text
< 500 ms
```

---

### API Response

Target:

```text
< 300 ms
```

---

# Security Requirements

## Authentication

- OAuth
- MFA Ready

## Authorization

- RBAC

Roles:

```text
Guest
Member
Premium
Admin
```

---

# Analytics

Track:

- Popular concepts
- Searches
- Click paths
- Resource engagement
- Completion of learning paths

---

# Deployment Architecture

## Frontend

```text
Vercel
```

## Backend

```text
AWS ECS
or
Azure Container Apps
```

## Database

```text
PostgreSQL Managed Service
Neo4j Aura
OpenSearch
```

## CDN

```text
Cloudflare
```

---

# Milestone Roadmap

## Phase 1 (Weeks 1–4)

Foundation

- Authentication
- Database setup
- Concept model
- Search

Deliverable:
Working backend

---

## Phase 2 (Weeks 5–8)

Graph Visualization

- D3 integration
- Relationships
- Sidebar

Deliverable:
Interactive knowledge graph

---

## Phase 3 (Weeks 9–12)

Resource Discovery

- Resource APIs
- Filtering
- Learning paths

Deliverable:
Functional MVP

---

## Phase 4 (Weeks 13–16)

Premium Layer

- Trend engine
- Timeline
- Personalization

Deliverable:
Premium beta

---

## Phase 5 (Weeks 17–24)

Advanced Intelligence

- Forecasting
- Credibility engine
- Enterprise capabilities

Deliverable:
Version 1.0 Launch

---

# Success Metrics (KPIs)

## Adoption

- 10,000 monthly active users
- 30% returning users

## Engagement

- Average session > 8 minutes
- Average 15 node interactions/session

## Learning

- 60% completion rate on learning paths

## Revenue

- 5% free-to-paid conversion
- 90% monthly subscription retention

---

# Product Vision Statement

AI Ecosystem Navigator should become the definitive visual operating system for understanding artificial intelligence.

Instead of searching for isolated definitions, users should be able to explore the AI ecosystem as a living, connected knowledge graph that continuously reflects the state of the industry, helps them learn more effectively, and enables better technology decisions.
