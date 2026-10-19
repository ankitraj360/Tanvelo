PROJECT NAME: TANVELO

PRODUCT: Tanvelo LLM API Gateway

PROJECT TYPE: Production-oriented developer infrastructure SaaS

ROLE:

Act as a senior full-stack engineer, software architect, UI/UX designer,

DevOps engineer, and security engineer.

Build Tanvelo as a complete, functional LLM API Gateway.

Use Stitch to design the frontend UI/UX before implementing it.

IMPORTANT: Build the actual application, not a prototype.

\==================================================

1\. CORE REQUIREMENTS

\==================================================

Build everything except authentication.

INCLUDE:

\- Frontend and UI/UX

\- Backend APIs

\- Database and migrations

\- Multiple projects

\- Multiple environments

\- Provider integrations

\- Model management

\- Unified API gateway

\- API key generation and validation for gateway requests

\- Request routing

\- Provider fallback

\- Safe retry handling

\- Rate limiting

\- Request logging

\- Error monitoring

\- Analytics

\- Token usage tracking

\- Cost estimation

\- Usage budgets

\- Alerts

\- Webhooks

\- Developer documentation

\- Testing

\- Deployment configuration

\- Security controls

EXCLUDE:

\- User registration

\- Login

\- Password authentication

\- OAuth

\- User accounts and authentication flows

IMPORTANT DISTINCTION:

Although dashboard authentication is excluded, API key authentication

for requests sent through Tanvelo MUST be implemented.

Gateway API keys are necessary to identify and authorize API clients.

They are not user login credentials.

Do not remove gateway API key functionality.

\==================================================

2\. NO MOCK OR DEMO DATA

\==================================================

This is a strict requirement.

Do not use:

\- Mock data

\- Demo datasets

\- Fake request logs

\- Fake analytics

\- Simulated provider responses

\- Fabricated usage statistics

\- Randomly generated dashboard metrics

\- Fake provider connection statuses

\- Fake latency measurements

\- Fake cost calculations presented as actual charges

\- Hardcoded production metrics

\- Fake customer information

Every metric displayed as actual activity must originate from real

application records or actual provider responses.

If the system has no data, display a proper empty state.

Examples:

"No requests have been recorded yet."

"No providers are configured."

"No usage data is available for this period."

Do not populate the dashboard with invented activity to make it

look populated.

You may use explicitly identified sample values in documentation

or automated tests, but never present them as real production data.

Use test fixtures only inside isolated test environments.

\==================================================

3\. Desing, also take inspiration from internet

\==================================================



Design these pages:

1\. Overview

2\. Projects

3\. Project details

4\. Providers

5\. Models

6\. API requests

7\. Request inspector

8\. Errors and failures

9\. Rate limits

10\. Analytics

11\. Usage and budgets

12\. Routing and fallbacks

13\. API keys

14\. Webhooks

15\. Developer documentation

16\. Settings

Establish reusable design components before implementing the pages.

After creating the designs, implement them in the actual application.

Do not stop after producing Stitch designs or screenshots.

If Stitch is unavailable in the current environment, report that

honestly and continue with the closest practical implementation.

DESIGN DIRECTION:

\- Premium developer SaaS

\- Dark navy and charcoal

\- Blue and cyan accents

\- Subtle violet highlights

\- Clean typography

\- Consistent spacing

\- Professional charts

\- Useful tables

\- Restrained visual effects

\- Responsive layouts

\- Accessible components

Avoid generic AI landing pages, unnecessary glowing effects,

cyberpunk styling, clutter, and fabricated social proof.

\==================================================

4\. APPLICATION ARCHITECTURE

\==================================================

Inspect the existing repository before making changes.

Preserve useful existing code and avoid unnecessary rewrites.

If the project is starting from scratch, use a suitable architecture:

Frontend:

\- Next.js

\- React

\- TypeScript

\- Tailwind CSS

\- shadcn/ui

\- Recharts

\- Lucide icons

Backend:

\- TypeScript

\- A suitable API framework, such as Fastify

\- PostgreSQL

\- Prisma or Drizzle ORM

\- Redis for distributed rate limiting and caching

\- A background job mechanism where necessary

Choose compatible, stable dependencies.

Use environment variables for secrets and deployment configuration.

Keep the gateway request path efficient and separate it from the

management dashboard.

Create clear modules for:

\- Gateway API

\- Provider adapters

\- Routing engine

\- Rate limiter

\- Usage metering

\- Request logging

\- Cost calculation

\- Alert processing

\- Webhook delivery

\- Dashboard API

\- Database access

Do not introduce unnecessary services or complexity.

\==================================================

5\. DATABASE

\==================================================

Implement a real database with migrations.

Create appropriate models for:

\- Projects

\- Environments

\- Provider connections

\- Model configurations

\- Gateway API keys

\- Routing rules

\- Rate-limit policies

\- Gateway requests

\- Provider attempts

\- Usage records

\- Cost records

\- Budgets

\- Alerts

\- Webhooks

\- Webhook delivery attempts

\- Configuration changes

Add appropriate:

\- Primary keys

\- Foreign keys

\- Indexes

\- Uniqueness constraints

\- Timestamps

\- Relationships

\- Data validation

Use database transactions where needed.

Do not silently lose usage records or request history.

Design project isolation carefully so data belonging to one project

cannot accidentally appear in another.

Do not add user authentication or login tables.

\==================================================

6\. MULTI-PROJECT MANAGEMENT

\==================================================

Implement actual project management.

Users must be able to:

\- Create projects

\- Rename projects

\- Update project settings

\- Delete projects with suitable safeguards

\- Create environments

\- Configure providers per project

\- Configure models per project

\- Configure rate limits per project

\- Configure routing rules per project

\- View project-specific requests

\- View project-specific errors

\- View project-specific analytics

\- View project-specific usage and costs

Persist all changes in PostgreSQL.

Do not implement project management using frontend-only state.

Enforce project isolation in backend queries and gateway operations.

Support Development, Staging, and Production environments.

\==================================================

7\. REAL PROVIDER INTEGRATIONS

\==================================================

Implement actual integrations using official provider APIs and

supported SDKs.

Initial providers:

\- OpenAI

\- Anthropic

\- Google Gemini

Design an extensible provider adapter architecture that can later

support additional OpenAI-compatible providers.

Each provider adapter must handle:

\- Authentication

\- Model selection

\- Request translation

\- Response normalization

\- Streaming where supported

\- Usage extraction

\- Timeout handling

\- Provider error translation

\- Rate-limit response handling

\- Retry eligibility

Do not return fabricated responses if a provider call fails.

Return a clear error instead.

Provider credentials must be supplied through secure configuration

forms or environment configuration.

Encrypt stored provider credentials using an appropriate server-side

encryption mechanism.

Never expose provider secrets to the browser.

Never log raw provider credentials.

A provider must not appear connected unless a real connection check

succeeds.

If a provider has not been configured, display that state honestly.

\==================================================

8\. UNIFIED GATEWAY API

\==================================================

Implement a real API endpoint compatible with the intended

OpenAI-style chat completions interface.

Primary endpoint:

POST /v1/chat/completions

Support:

\- Gateway API key validation

\- Project and environment identification

\- Model resolution

\- Provider selection

\- Provider request execution

\- Response normalization

\- Usage recording

\- Error handling

\- Rate-limit enforcement

\- Request logging

\- Streaming where supported

Use a gateway API key in the Authorization header:

Authorization: Bearer YOUR\_TANVELO\_API\_KEY

Never require users to expose their upstream provider keys in

client applications.

The gateway must use server-side provider credentials.

Validate incoming requests before sending them to providers.

Implement request size limits, timeouts, and sensible resource limits.

Do not claim complete compatibility with a provider API until the

relevant behavior has been implemented and tested.

Document supported parameters and known compatibility differences.

\==================================================

9\. API KEY MANAGEMENT

\==================================================

Implement real gateway API key management.

Support:

\- Key creation

\- Key naming

\- Project assignment

\- Environment assignment

\- Key permissions where appropriate

\- Key revocation

\- Key rotation

\- Key creation timestamps

\- Last-used timestamps

\- Key status

\- Key prefix display

Generate keys using a cryptographically secure random generator.

Show the complete key only at creation time.

Store a secure hash for key verification instead of storing the

complete gateway key in plaintext.

Ensure key rotation and revocation take effect promptly.

Never include complete keys in request logs.

Remember: gateway API key authentication is INCLUDED.

User login and dashboard authentication are EXCLUDED.

\==================================================

10\. ROUTING AND FALLBACKS

\==================================================

Implement actual deterministic routing.

Support configuration of:

\- Preferred provider

\- Preferred model

\- Secondary provider

\- Secondary model

\- Fallback on eligible provider failures

\- Fallback on eligible rate limits

\- Fallback on timeouts where appropriate

\- Maximum retry attempts

\- Per-provider timeouts

The routing engine must use explicit configuration and predictable

rules.

Do not use an embedded AI model to make routing decisions.

Do not retry unsafe operations indiscriminately.

Avoid duplicate billable requests where possible.

Respect provider retry guidance, deadlines, and configured limits.

Record each provider attempt and its outcome.

Display the actual routing sequence in the request inspector.

\==================================================

11\. RATE LIMITING

\==================================================

Implement real, distributed rate limiting.

Use Redis or another suitable shared atomic mechanism.

Support configurable limits such as:

\- Requests per minute

\- Requests per hour

\- Requests per day

\- Tokens per minute, when usage can be measured reliably

Allow limits to be configured by gateway API key and project.

Return HTTP 429 when a gateway-enforced limit is exceeded.

Return appropriate rate-limit headers where applicable.

Distinguish between:

1\. Gateway-enforced limits

2\. Upstream provider limits

3\. Provider quota exhaustion

Do not classify all HTTP 429 errors as the same failure.

Make rate limiting resilient to concurrent requests.

Document behavior when the rate-limit infrastructure is unavailable.

Do not silently disable rate limiting in production.

\==================================================

12\. REQUEST LOGGING AND INSPECTION

\==================================================

Record real gateway requests.

Capture appropriate metadata, including:

\- Request ID

\- Timestamp

\- Project

\- Environment

\- Gateway key identifier

\- Provider

\- Model

\- HTTP status

\- Total latency

\- Provider latency

\- Input tokens

\- Output tokens

\- Estimated cost

\- Error category

\- Provider attempts

Create a detailed request inspector with:

\- Request metadata

\- Sanitized request information

\- Sanitized response information

\- Provider attempts

\- Error details

\- Timing breakdown

\- Usage information

Apply privacy controls to request and response bodies.

Do not store sensitive content by default unless explicitly enabled

through an appropriate configuration.

Redact secrets, credentials, and authorization headers.

Support retention policies and bounded log storage.

Do not pretend an unrecorded request exists.

\==================================================

13\. ERROR MONITORING

\==================================================

Implement real error categorization.

Support categories such as:

\- Invalid request

\- Gateway key rejected

\- Gateway rate limit exceeded

\- Provider authentication failure

\- Provider rate limit exceeded

\- Provider quota exhaustion

\- Provider unavailable

\- Timeout

\- Network error

\- Unsupported model

\- Internal gateway error

Create error tables and detail pages based on real request records.

Add filters for project, provider, model, status, and date range.

Show empty states when no errors have been recorded.

Do not manufacture error events to populate the dashboard.

\==================================================

14\. ANALYTICS

\==================================================

Calculate analytics from persisted usage and request records.

Support:

\- Total requests

\- Successful requests

\- Failed requests

\- Success rate

\- Error rate

\- Average latency

\- P95 latency

\- Requests by provider

\- Requests by model

\- Requests by project

\- Token usage

\- Estimated cost over time

Use actual timestamps and stored usage information.

Handle missing provider usage information explicitly.

Do not invent token counts or latency values.

Ensure filters apply consistently to charts, summary cards, and tables.

Implement pagination for large request histories.

Add CSV export based on actual filtered records.

Clearly distinguish estimated costs from actual provider invoices.

\==================================================

15\. COST CALCULATION

\==================================================

Implement a versioned model pricing configuration.

Support configurable input and output prices.

Calculate costs from actual usage records and the configured pricing

version applicable to the request.

Handle cached tokens, reasoning tokens, or other usage categories

when relevant to a provider and supported by its response.

If usage is missing, do not invent it.

Display unknown or incomplete cost information explicitly.

Store enough information to explain how an estimate was calculated.

Never describe an estimate as a verified provider charge.

\==================================================

16\. USAGE BUDGETS AND ALERTS

\==================================================

Implement real usage budgets.

Support:

\- Project budget

\- Environment-specific limits where appropriate

\- Warning thresholds

\- Usage monitoring

\- Budget status

\- Alert history

Where reliable enforcement is possible, prevent new requests after

a configured hard limit is reached.

Use atomic or transaction-safe checks to avoid race conditions.

Explain that in-flight requests and provider-side billing may create

small discrepancies.

Do not promise perfect cost control when provider pricing or usage

information is incomplete.

\==================================================

17\. WEBHOOKS

\==================================================

Implement actual webhook delivery.

Support configurable events such as:

\- Request failure

\- Provider unavailable

\- Rate limit exceeded

\- Budget warning

\- Budget exceeded

Implement:

\- Signed payloads

\- Delivery attempts

\- Timeouts

\- Retry scheduling

\- Delivery status

\- Failure logs

\- Replay protection where appropriate

Prevent server-side request forgery.

Validate destination URLs and block loopback, private, link-local,

and cloud metadata destinations unless explicitly permitted under

a carefully controlled trusted-network policy.

Revalidate DNS resolution and redirect destinations as appropriate.

Never expose webhook signing secrets.

\==================================================

18\. FRONTEND DASHBOARD

\==================================================

Implement a complete, responsive Tanvelo dashboard.

Sidebar:

\- Overview

\- Projects

\- Providers

\- Models

\- API Requests

\- Errors & Failures

\- Rate Limits

\- Analytics

\- Usage & Budgets

\- Routing & Fallbacks

\- API Keys

\- Webhooks

\- Documentation

\- Settings

Implement:

\- Search

\- Filtering

\- Sorting

\- Pagination

\- Project selection

\- Environment selection

\- Date-range selection

\- Charts

\- Tables

\- Forms

\- Modals

\- Confirmation dialogs

\- Toast notifications

\- Loading states

\- Error states

\- Empty states

All displayed production metrics must come from actual backend data.

Every action must perform its intended backend operation.

Do not leave buttons that appear functional but do nothing.

Do not substitute hardcoded dashboard numbers for real data.

\==================================================

19\. NO DASHBOARD AUTHENTICATION

\==================================================

Do not build login, registration, OAuth, or user authentication.

However, the absence of authentication creates a security risk.

Until dashboard authentication is implemented, bind the management

dashboard to localhost or an explicitly trusted private network.

Do not expose management APIs publicly without suitable access controls.

Keep management routes separate from public gateway routes.

Never allow an unauthenticated internet user to:

\- Create or delete projects

\- Read provider credentials

\- Create or revoke API keys

\- Change routing rules

\- Read private request bodies

\- Modify budgets

\- Configure webhooks

If the application is intended for deployment on a public server,

refuse unsafe exposure of management functions and document the

required deployment restrictions.

Do not pretend that network binding replaces authentication.

\==================================================

20\. DEVELOPER DOCUMENTATION

\==================================================

Create actual documentation for the implemented gateway.

Include:

\- Quickstart

\- Project setup

\- Provider configuration

\- API key creation

\- Chat completions endpoint

\- Supported request parameters

\- Streaming behavior

\- Error responses

\- Rate-limit headers

\- Routing and fallback behavior

\- Usage tracking

\- Cost estimation

\- Webhook signatures

\- Deployment instructions

Provide copyable code examples.

Ensure the documentation matches the actual implementation.

Do not document unsupported features as if they already work.

\==================================================

21\. TESTING

\==================================================

Create meaningful automated tests.

Include:

\- Unit tests

\- API integration tests

\- Database tests

\- Provider adapter tests

\- Rate-limit concurrency tests

\- Gateway key validation tests

\- Project isolation tests

\- Routing and fallback tests

\- Usage accounting tests

\- Cost calculation tests

\- Webhook signature tests

\- Webhook retry tests

\- Frontend component tests

\- End-to-end tests where practical

Use isolated test data and mocked provider responses only inside

automated tests.

Never present test results as real production activity.

Verify that one project's data cannot leak into another project.

Verify that revoked gateway keys are rejected.

Verify that upstream provider errors are handled correctly.

\==================================================

22\. IMPLEMENTATION PHASES

\==================================================

PHASE 1:

Inspect the repository, confirm the stack, and use Stitch to create

the Tanvelo design system.

PHASE 2:

Build the application foundation, database, migrations, and backend

architecture.

PHASE 3:

Build project and environment management.

PHASE 4:

Implement provider connections and model configuration.

PHASE 5:

Implement gateway API key management and the unified gateway endpoint.

PHASE 6:

Implement provider adapters, routing, fallbacks, and streaming.

PHASE 7:

Implement rate limiting and request logging.

PHASE 8:

Implement request inspection, error monitoring, and analytics.

PHASE 9:

Implement usage tracking, pricing, budgets, and alerts.

PHASE 10:

Implement webhooks and developer documentation.

PHASE 11:

Connect every dashboard page to real backend APIs.

PHASE 12:

Implement automated testing and security controls.

PHASE 13:

Prepare deployment configuration, health checks, and operational

documentation.

PHASE 14:

Perform a complete end-to-end review.

Do not stop after writing the plan.

Implement each phase and verify it before proceeding.

\==================================================

23\. DEFINITION OF DONE

\==================================================

Tanvelo is ready for review when:

\- Stitch designs have been used to guide the UI, where available.

\- The frontend is fully connected to the backend.

\- PostgreSQL stores real application records.

\- Projects and environments persist correctly.

\- Real provider integrations work with valid configured credentials.

\- The unified gateway endpoint makes real provider calls.

\- Gateway API keys are securely validated.

\- Routing and fallback behavior work.

\- Rate limits are enforced.

\- Request logs contain actual requests.

\- Error monitoring uses actual events.

\- Analytics are calculated from actual records.

\- Usage and cost calculations are transparent.

\- Budgets and alerts work.

\- Webhook delivery works.

\- Documentation matches the implementation.

\- Automated tests pass.

\- Secrets are protected.

\- No mock or demo data appears in production views.

\- No dashboard authentication has been added.

\- The management dashboard is not exposed unsafely.

\- Setup and deployment instructions are complete.

Start by inspecting the existing repository and checking Stitch

availability.

Then implement the product feature by feature.

Do not claim completion for features that have not been implemented

and tested.