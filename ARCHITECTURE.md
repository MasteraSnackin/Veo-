# System Architecture: Veo Housing Platform

## Overview

The Veo Housing Platform is an AI-powered property recommendation engine designed to provide personalised, data-driven area recommendations for London property seekers. The system employs a unique 3-layer AI orchestration architecture that separates directive-based instructions (Layer 1) from intelligent routing and decision-making (Layer 2), and deterministic script execution (Layer 3). This architectural pattern ensures reliability, maintainability, and self-improvement capabilities whilst leveraging the probabilistic nature of large language models only where appropriate.

The primary goal of the system is to automate the complex process of location research, providing users with data-driven insights tailored to their specific lifestyle personas (e.g., students, parents, or investors).

## Key Requirements

### Functional
- **Persona-Driven Recommendations**: Tailor results based on specific user profiles and priorities.
- **Multi-Source Data Enrichment**: Integrate data from 8+ sources: ScanSan, TfL, UK Police, Ofsted, Google Maps, Perplexity AI, ONS Geography, and amenities databases.
- **Natural Language Generation**: Provide human-readable explanations for all recommendations.
- **Multimedia Output**: Generate AI video explainers with Google Maps imagery for top-ranked areas.
- **Real-Time Research**: Fetch current area news and development updates via Perplexity AI.
- **Geographic Visualization**: Provide GeoJSON boundary data for mapping integrations.

### Non-Functional
- **Scalability**: Handle concurrent API requests and data processing for multiple users.
- **Reliability**: Implement robust error handling, retries, and fallback mechanisms for external API dependencies.
- **Performance**: Minimise latency through aggressive caching and parallel execution.
- **Maintainability**: Use a directive-based approach to allow system updates without core code changes.

## High-Level Architecture

The system is built on a **3-Layer Orchestration Pattern**:

1.  **Layer 1: Directives (The Brain)**: Markdown-based Standard Operating Procedures (SOPs) that define the "how-to" for every system task.
2.  **Layer 2: Orchestrator (The Manager)**: An LLM-powered (Anthropic Claude) decision-making layer that reads directives and routes tasks.
3.  **Layer 3: Execution (The Workers)**: Deterministic Python scripts that perform the actual API calls and data processing.

```mermaid
graph TD
    User[User Interface/API] --> Orchestrator[Layer 2: AI Orchestrator
Claude LLM]
    Orchestrator --> Directives[Layer 1: Directives
Markdown SOPs]
    
    subgraph "Layer 3: Execution Scripts"
        Orchestrator --> ScanSan[scansan_api.py]
        Orchestrator --> TfL[tfl_commute.py]
        Orchestrator --> Crime[crime_data.py]
        Orchestrator --> Schools[schools_ofsted.py]
        Orchestrator --> Video[generate_video.py]
        Orchestrator --> Maps[fetch_google_maps.py]
        Orchestrator --> Research[fetch_perplexity.py]
        Orchestrator --> Boundaries[fetch_ons_boundaries.py]
    end

    subgraph "External Services"
        ScanSan --> ScanSanAPI[ScanSan Property API]
        TfL --> TfLAPI[TfL Unified API]
        Crime --> PoliceAPI[UK Police Data API]
        Schools --> GIAS[GIAS / Ofsted API]
        Video --> VideoAI[Veo / Sora / LTX]
        Maps --> MapsAPI[Google Maps API]
        Research --> PerplexityAPI[Perplexity AI API]
        Boundaries --> ONSAPI[ONS Open Geography API]
    end
    
    ScanSanAPI --> Cache[(Redis Cache)]
    TfLAPI --> Cache
    PoliceAPI --> Cache
    GIAS --> Cache
    MapsAPI --> Cache
    PerplexityAPI --> Cache
    ONSAPI --> Cache
```

*This diagram illustrates the flow from a user request through the intelligent orchestration layer to the deterministic execution workers and external data providers.*

## Component Details

### AI Orchestrator (Layer 2)
- **Responsibilities**: Interpreting user intent, reading task-specific directives, routing calls to execution scripts, and synthesizing final results.
- **Technologies**: Anthropic Claude API, Python.
- **Communication**: Communicates with the UI via REST/CLI and with the Execution Layer via subprocess calls or function imports.

### Directives (Layer 1)
- **Responsibilities**: Defining the logic for data fetching, scoring weights for different personas, and output formats.
- **Technologies**: Markdown.
- **Ownership**: Owns the "system knowledge" and business logic.

### Execution Scripts (Layer 3)
- **Responsibilities**: Performing specific, deterministic tasks like API requests, data cleaning, and scoring.
- **Technologies**: Python (Pandas, NumPy, Requests, aiohttp).
- **Communication**: Stateless scripts that return structured JSON data to the Orchestrator.

### External Integrations
- **ScanSan API**: Provides property intelligence, investment quality, and affordability scores.
- **TfL API**: Calculates precise commute times to specific destinations.
- **UK Police API**: Fetches localized crime statistics and safety ratings.
- **GIAS/Ofsted**: Provides school performance data and catchment area information.
- **Google Maps API**: Geocoding, static map generation, nearby places search, and distance calculations.
- **Perplexity AI API**: Real-time area research, development news, and persona-specific insights with citations.
- **ONS Open Geography API**: Official UK administrative boundary data in GeoJSON format (LSOA, MSOA, Ward, District).
- **Climate & Weather API**: Provides climate data, weather patterns, and environmental quality metrics for area assessment *(planned)*.

```mermaid
flowchart LR
    subgraph "Layer 1: Knowledge Base"
        DIR[Directives<br/>Markdown SOPs]
    end
    
    subgraph "Layer 2: Orchestration"
        ORCH[AI Orchestrator<br/>Claude LLM]
    end
    
    subgraph "Layer 3: Execution Workers"
        SCAN[ScanSan Script]
        TFL[TfL Script]
        CRIME[Crime Data Script]
        SCHOOL[Schools Script]
        VIDEO[Video Generator]
        MAPS[Maps Script]
        RESEARCH[Research Script]
        BOUNDS[Boundaries Script]
    end

    subgraph "External APIs"
        API_SCAN[ScanSan API]
        API_TFL[TfL API]
        API_POLICE[Police API]
        API_GIAS[GIAS/Ofsted]
        API_VIDEO[Video AI]
        API_MAPS[Google Maps API]
        API_PERP[Perplexity AI]
        API_ONS[ONS Geography]
    end
    
    CACHE[(Redis Cache)]
    
    UI[User Interface] -->|Request + Persona| ORCH
    ORCH -->|Read Rules| DIR
    
    ORCH -->|Invoke| SCAN
    ORCH -->|Invoke| TFL
    ORCH -->|Invoke| CRIME
    ORCH -->|Invoke| SCHOOL
    ORCH -->|Invoke| VIDEO
    ORCH -->|Invoke| MAPS
    ORCH -->|Invoke| RESEARCH
    ORCH -->|Invoke| BOUNDS

    SCAN <-->|Check/Store| CACHE
    TFL <-->|Check/Store| CACHE
    CRIME <-->|Check/Store| CACHE
    SCHOOL <-->|Check/Store| CACHE
    MAPS <-->|Check/Store| CACHE
    RESEARCH <-->|Check/Store| CACHE
    BOUNDS <-->|Check/Store| CACHE

    SCAN -->|Fetch Data| API_SCAN
    TFL -->|Fetch Data| API_TFL
    CRIME -->|Fetch Data| API_POLICE
    SCHOOL -->|Fetch Data| API_GIAS
    VIDEO -->|Generate| API_VIDEO
    MAPS -->|Fetch Data| API_MAPS
    RESEARCH -->|Fetch Data| API_PERP
    BOUNDS -->|Fetch Data| API_ONS
    
    SCAN -->|Return JSON| ORCH
    TFL -->|Return JSON| ORCH
    CRIME -->|Return JSON| ORCH
    SCHOOL -->|Return JSON| ORCH
    VIDEO -->|Return Video URL| ORCH
    MAPS -->|Return JSON| ORCH
    RESEARCH -->|Return JSON| ORCH
    BOUNDS -->|Return GeoJSON| ORCH

    ORCH -->|Synthesize<br/>& Rank| UI
```

## Data Flow

### Typical Recommendation Flow
1. **Request**: User provides persona (e.g., "Student") and preferences (Budget, Destination).
2. **Orchestration**: The Orchestrator reads `MASTER_ORCHESTRATION.md` to determine the workflow.
3. **Fetching**: The Orchestrator triggers 6-8 Layer 3 scripts in parallel to fetch data from:
   - ScanSan (property intelligence)
   - TfL (commute times)
   - UK Police (crime statistics)
   - Ofsted (school ratings)
   - Google Maps (geocoding, nearby places)
   - Perplexity AI (real-time area research)
   - ONS Geography (boundary data)
4. **Caching**: Redis checks for cached results with multi-tier TTL (1hr-90 days).
5. **Scoring**: Data is passed to the Scoring Engine which applies weights defined in the persona directives.
6. **Enrichment**: Google Maps imagery, Perplexity insights, and ONS boundaries added to recommendations.
7. **Synthesis**: Results are ranked, and the Explainer Generator creates a natural language summary.
8. **Optional Video**: AI-generated video explainer with maps on user demand.
9. **Delivery**: The final ranked list with comprehensive data and explanations is returned to the user.

```mermaid
sequenceDiagram
    participant U as User
    participant O as Orchestrator
    participant D as Directives
    participant E as Execution Scripts
    participant C as Cache/APIs

    U->>O: Provide Persona & Preferences
    O->>D: Read Orchestration Rules
    D-->>O: Workflow Steps
    O->>E: Trigger Parallel Data Fetching
    E->>C: Check Cache / Call APIs
    C-->>E: Return Raw Data
    E-->>O: Return JSON Results
    O->>O: Rank & Synthesise
    O->>U: Deliver Recommendations
```

## Data Model (High-Level)

The system primarily handles structured JSON data objects:
- **AreaProfile**: Contains aggregated scores (Safety, Affordability, Commute) and raw metadata for a specific postcode district.
- **PersonaDefinition**: A configuration object defining the importance (weights) of different metrics for a specific user type.
- **RecommendationSet**: A ranked collection of AreaProfiles with generated narrative explanations.

```mermaid
classDiagram
    class AreaProfile {
        +String postcodeDistrict
        +Float safetyScore
        +Float affordabilityScore
        +Float commuteScore
        +Float schoolScore
        +Map~String,Any~ rawMetadata
        +Float overallScore
    }
    
    class PersonaDefinition {
        +String personaType
        +Float safetyWeight
        +Float affordabilityWeight
        +Float commuteWeight
        +Float schoolWeight
        +Map~String,Any~ preferences
    }
    
    class RecommendationSet {
        +List~AreaProfile~ rankedAreas
        +String narrativeExplanation
        +DateTime generatedAt
        +PersonaDefinition persona
        +getTopN(n)
    }
    
    RecommendationSet "1" --> "*" AreaProfile : contains
    RecommendationSet "1" --> "1" PersonaDefinition : based on
```

## Infrastructure & Deployment

- **Deployment**: The system is designed to run in **Docker containers**, orchestrated by **Kubernetes** for production environments.
- **Environments**:
    - **Dev**: Local environment using `.env` files and local Redis.
    - **Staging**: Cloud-hosted environment for integration testing with full API access.
    - **Prod**: High-availability environment with auto-scaling and persistent Redis caching.
 
```mermaid
graph TB
    subgraph "Production Environment - Kubernetes Cluster"
        subgraph "Ingress Layer"
            
        end
        
        subgraph "Application Layer"
            API1[API Pod 1<br/>Orchestrator + FastAPI]
            API2[API Pod 2<br/>Orchestrator + FastAPI]
            API3[API Pod 3<br/>Orchestrator + FastAPI]
        end
        
        subgraph "Worker Layer"
            W1[Worker Pod 1<br/>Execution Scripts]
            W2[Worker Pod 2<br/>Execution Scripts]
        end
        
        subgraph "Cache Layer"
            Redis[(Redis<br/>Persistent Volume)]
        end
        
        subgraph "Config"
            Secrets[Secret Manager<br/>API Keys]
            ConfigMaps[ConfigMaps<br/>Directives]
        end
    end
    
    subgraph "External Services"
        ScanSan[ScanSan API]
        TfL[TfL API]
        Police[UK Police API]
        Ofsted[GIAS/Ofsted API]
        Claude[Anthropic Claude]
        Video[Video AI Services]
        Maps[Google Maps API]
        Perplexity[Perplexity AI]
        ONS[ONS Open Geography]
    end
    
    Users[Users] --> LB
    LB --> API1
    LB --> API2
    LB --> API3
    
    API1 --> W1
    API2 --> W2
    API3 --> W1
    
    API1 --> Redis
    API2 --> Redis
    API3 --> Redis
    
    W1 --> ScanSan
    W1 --> TfL
    W1 --> Police
    W2 --> Ofsted
    W2 --> Video
    W1 --> Maps
    W2 --> Perplexity
    W1 --> ONS

    API1 --> Claude
    API2 --> Claude
    API3 --> Claude
    API1 --> Perplexity
    API2 --> Perplexity
    
    API1 -.-> Secrets
    API2 -.-> Secrets
    API3 -.-> Secrets
    W1 -.-> Secrets
    W2 -.-> Secrets
    
    API1 -.-> ConfigMaps
    API2 -.-> ConfigMaps
    API3 -.-> ConfigMaps
```

## Scalability & Reliability

- **Caching**: Aggressive caching using **Redis** ensures that repeated area requests do not hit external API rate limits and reduce latency.
- **Parallelism**: Uses **aiohttp** and Python's `asyncio` for non-blocking I/O during multi-source data fetching.
- **Fault Tolerance**: Exponential backoff retries for all external API calls and a fallback chain for video generation services.

## Security & Compliance

- **Auth**: API key management via environment variables and secret managers (e.g., AWS Secrets Manager).
- **Data Protection**: No personally identifiable information (PII) is stored; all property data is aggregated at the postcode district level.
- **Compliance**: Adheres to the terms of use for all integrated UK government and third-party APIs.

## Observability

- **Logging**: Structured logging using **structlog** to track orchestration decisions and execution script performance.
- **Metrics**: Monitoring API latency, cache hit rates, and LLM token usage.

## Trade-offs & Decisions

- **LLM vs. Hardcoded Logic**: We chose LLM orchestration to allow for flexible, natural language interactions and easier system updates via Markdown, at the cost of slight latency and token expenses.
- ** Postcode District vs. Full Postcode**: Data is aggregated at the district level (e.g., E1) to ensure high cache hit rates and comply with data privacy while remaining useful for area-level recommendations.

## Recent Enhancements (Phase 3 - 2026-02-01)

### Google Maps Integration
- **Geocoding**: Convert area codes to precise coordinates
- **Static Maps**: Generate map images with custom markers
- **Nearby Places**: Search for amenities (cafes, gyms, schools, transport)
- **Distance Matrix**: Calculate distances between locations
- **Cache**: 24-hour TTL for map data

### Perplexity AI Research
- **Real-Time Insights**: Current area developments and news
- **Persona-Specific**: Tailored research for students, parents, developers
- **Citation Tracking**: Source attribution for all claims
- **UK-Focused**: Search limited to recent UK sources
- **Cache**: 6-hour TTL for freshness

### ONS Open Geography Boundaries
- **GeoJSON Format**: Ready for mapping libraries (Leaflet, Mapbox, Google Maps)
- **Hierarchical Data**: LSOA → MSOA → Ward → District
- **Simple & Full Modes**: Balance between speed and detail
- **Free API**: No API key required (uses postcodes.io)
- **Cache**: 90-day TTL (boundaries rarely change)

## Future Improvements

- **Real-time Market Data**: Integrating live property listings from Rightmove/Zoopla to show current availability.
- **Feedback Loop**: Implementing a reinforcement learning layer to improve recommendation accuracy based on user interactions.
- **Interactive Map UI**: Adding a full map interface to the front-end with boundary overlays for better area comparison.
- **Climate Data**: Integration with climate and weather APIs for sustainability scoring *(planned)*.
