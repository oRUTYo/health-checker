**Dataset Flow**
```mermaid
    A[Raw CSV from Kaggle] --> B[Data Ingestion Layer]
    B --> C[Preprocessing & EDA]
    C --> D[Annotation Layer<br/>Label Studio/CVAT]
    D --> E[Versioned Dataset<br/>DVC + Git]
    E --> F[Model Training]
    F --> G[Evaluation & Feedback]
    G --> D
```
