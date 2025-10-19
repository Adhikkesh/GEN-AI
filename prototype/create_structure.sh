#!/bin/bash

# Base directories
mkdir -p apps/backend/{advisor,interview-bot,onboarding,ingestion,notification}
mkdir -p packages/{shared-types,shared-utils,gcp-clients}

# ----- apps/backend/advisor -----
mkdir -p apps/backend/advisor/src/{routes,controllers,services,clients}
touch apps/backend/advisor/src/index.ts
touch apps/backend/advisor/src/routes/dashboard.routes.ts
touch apps/backend/advisor/src/routes/roadmap.routes.ts
touch apps/backend/advisor/src/controllers/dashboard.controller.ts
touch apps/backend/advisor/src/controllers/roadmap.controller.ts
touch apps/backend/advisor/src/services/dashboard.service.ts
touch apps/backend/advisor/src/services/recommendation.service.ts
touch apps/backend/advisor/src/clients/{gcp.ts,neo4j.ts}
touch apps/backend/advisor/{Dockerfile,package.json,tsconfig.json}

# ----- apps/backend/interview-bot -----
mkdir -p apps/backend/interview-bot/src/{routes,controllers,services,clients}
touch apps/backend/interview-bot/src/index.ts
touch apps/backend/interview-bot/src/routes/conversation.routes.ts
touch apps/backend/interview-bot/src/controllers/conversation.controller.ts
touch apps/backend/interview-bot/src/services/conversation.service.ts
touch apps/backend/interview-bot/src/clients/{gcp.ts,firestore.ts}
touch apps/backend/interview-bot/{Dockerfile,package.json,tsconfig.json}

# ----- apps/backend/onboarding -----
mkdir -p apps/backend/onboarding/src/{logic,clients}
touch apps/backend/onboarding/src/index.ts
touch apps/backend/onboarding/src/logic/{resumeParser.ts,quizGenerator.ts}
touch apps/backend/onboarding/src/clients/gcp.ts
touch apps/backend/onboarding/{package.json,tsconfig.json}

# ----- apps/backend/ingestion -----
mkdir -p apps/backend/ingestion/src/{pipelines,utils,clients}
touch apps/backend/ingestion/src/index.ts
touch apps/backend/ingestion/src/pipelines/{jobsPipeline.ts,coursesPipeline.ts,skillsPipeline.ts}
touch apps/backend/ingestion/src/utils/{parser.ts,cleaner.ts}
touch apps/backend/ingestion/src/clients/{gcp.ts,externalAPI.ts}
touch apps/backend/ingestion/{package.json,tsconfig.json}

# ----- apps/backend/notification -----
mkdir -p apps/backend/notification/src/{logic,clients}
touch apps/backend/notification/src/index.ts
touch apps/backend/notification/src/logic/{emailNotifier.ts,pushNotifier.ts}
touch apps/backend/notification/src/clients/{gcp.ts,pubsub.ts}
touch apps/backend/notification/{package.json,tsconfig.json}

# ----- packages/shared-types -----
mkdir -p packages/shared-types/src
touch packages/shared-types/src/{user.types.ts,job.types.ts,message.types.ts,index.ts}
touch packages/shared-types/package.json
touch packages/shared-types/tsconfig.json

# ----- packages/shared-utils -----
mkdir -p packages/shared-utils/src
touch packages/shared-utils/src/{logger.ts,validation.ts,index.ts}
touch packages/shared-utils/package.json
touch packages/shared-utils/tsconfig.json

# ----- packages/gcp-clients -----
mkdir -p packages/gcp-clients/src
touch packages/gcp-clients/src/{firestoreClient.ts,storageClient.ts,pubsubClient.ts,geminiClient.ts,docAiClient.ts,index.ts}
touch packages/gcp-clients/package.json
touch packages/gcp-clients/tsconfig.json

echo "✅ Folder structure and placeholder files created successfully!"
echo "⚠️ Any changes to existing files like package.json or tsconfig.json should be done manually."
