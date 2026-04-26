# Graph Report - Alea-Antigravity  (2026-04-26)

## Corpus Check
- 211 files · ~301,114 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 661 nodes · 921 edges · 30 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 100 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 35|Community 35]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 104 edges
2. `POST()` - 99 edges
3. `executeHermesTool()` - 34 edges
4. `setShowToast()` - 23 edges
5. `createAuthenticatedClient()` - 22 edges
6. `DELETE()` - 18 edges
7. `PATCH()` - 13 edges
8. `HermesClient` - 11 edges
9. `PaperclipClient` - 10 edges
10. `checkAuth()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `send_to_webhook()` --calls--> `POST()`  [INFERRED]
  scripts/fetch_simple.py → src/app/api/meetings/route.ts
- `trigger_ai_analysis()` --calls--> `POST()`  [INFERRED]
  scripts/fetch_emails.py → src/app/api/meetings/route.ts
- `get_email_body()` --calls--> `GET()`  [INFERRED]
  scripts/fetch_simple.py → src/app/auth/callback/route.ts
- `get_attachments()` --calls--> `GET()`  [INFERRED]
  scripts/fetch_simple.py → src/app/auth/callback/route.ts
- `main()` --calls--> `GET()`  [INFERRED]
  scripts/fetch_simple.py → src/app/auth/callback/route.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (40): createAuthenticatedClient(), addKnowledgeTriple(), addMemory(), deleteDrawer(), formatMemoryContextForAI(), getDrawers(), getEntityTimeline(), getInvestorPreferences() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (25): generateText(), isMiniMaxConfigured(), getClassificationPrompt(), catch(), analyzeWithAI(), createCalendarEvent(), createRecord(), generateBlindListingHTML() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (31): analyze_with_groq(), download_attachment(), get_email_body_and_attachments(), main(), Analiza el contenido con Groq AI, Guarda en Supabase directamente, Envía el email a la API de Next.js, Descarga un adjunto y lo guarda localmente (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (19): checkAuth(), classifyInvestor(), fetchProfiles(), getStatusColor(), handleContactAgent(), handleOSINTSearch(), handleRefresh(), handleSearchChange() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (38): analyzePiedraFromObservations(), detectEmailType(), executeAgendaCompleteAction(), executeAgendaCreateAction(), executeAgendaGetPending(), executeAnalyzeOpportunity(), executeCalculateCommission(), executeCheckMandateExclusivity() (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (25): handleApproveAgent(), handleCreateAgent(), handleCreateCollaborator(), handleCreateInvestor(), handleCreateLead(), handleCreateMandatario(), handleDeleteCollaborator(), handleDeleteInvestor() (+17 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (6): createInsForgeClient(), getClient(), initClient(), setInsforgeToken(), handleChange(), handleSubmit()

### Community 7 - "Community 7"
Cohesion: 0.14
Nodes (6): checkAdobeCallback(), downloadPdf(), fetchNdas(), handleGeneratePDF(), handleSendForSignature(), generateNdaPDF()

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (2): HermesClient, HermesError

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (13): connect_imap(), get_emails(), main(), mark_as_read(), parse_email(), Guardar email en Supabase, Disparar análisis con IA, Marcar email como leído (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.23
Nodes (12): get_attachments(), get_email_body(), is_relevant_email(), load_last_processed(), main(), Cargar último email procesado, Guardar último email procesado, Extraer cuerpo del email (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (3): ErrorBoundary, extractPDFContent(), extractTextFromPDF()

### Community 12 - "Community 12"
Cohesion: 0.23
Nodes (7): analyzeImage(), createProperty(), extractTextFromPDF(), main(), parseWithMinimax(), searchProperty(), uploadFile()

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (6): getRedirectPath(), getUserProfile(), isAdmin(), isAgent(), isInvestor(), isUserActive()

### Community 14 - "Community 14"
Cohesion: 0.33
Nodes (6): createServerClient(), calculateAleaScore(), runRadarScan(), scanBOE(), scanBoletines(), scanConcursos()

### Community 15 - "Community 15"
Cohesion: 0.36
Nodes (5): completeAction(), createAction(), fetchActions(), fetchSuggestions(), syncCalendarEvent()

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (2): initJitsi(), loadJitsi()

### Community 17 - "Community 17"
Cohesion: 0.28
Nodes (5): fetchSuggestions(), handleApprove(), handleReject(), handleSync(), setActionLoading()

### Community 18 - "Community 18"
Cohesion: 0.42
Nodes (8): findInvestorId(), findPropertyId(), getMimeType(), getUploadStrategy(), insertDocument(), main(), updateProperty(), uploadFile()

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (2): fetchInvitations(), handleInvite()

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (2): endMeeting(), fetchMeetings()

### Community 21 - "Community 21"
Cohesion: 0.29
Nodes (3): useAdmin(), useAdminActions(), useAdminData()

### Community 22 - "Community 22"
Cohesion: 0.4
Nodes (3): createAgreement(), uploadTransientDocument(), handleSendForSignature()

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (3): exchangeCodeForTokens(), generateState(), getAdobeAuthUrl()

### Community 25 - "Community 25"
Cohesion: 0.6
Nodes (3): fetchFromInsForge(), getAuthToken(), queryTable()

### Community 26 - "Community 26"
Cohesion: 0.6
Nodes (3): calcularComisiones(), formatearComision(), generarResumenComisiones()

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (2): handleKeyPress(), sendMessage()

### Community 28 - "Community 28"
Cohesion: 0.6
Nodes (3): getInsForgeUrl(), main(), updateDocumentUrl()

### Community 29 - "Community 29"
Cohesion: 0.67
Nodes (2): handleKeyPress(), sendMessage()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (1): checkAuth()

## Knowledge Gaps
- **23 isolated node(s):** `Determina si el email es relevante para Alea Signature`, `Cargar último email procesado`, `Guardar último email procesado`, `Extraer cuerpo del email`, `Enviar al webhook con reintentos` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (16 nodes): `createHermes()`, `HermesClient`, `.addMessage()`, `.chat()`, `.chatStream()`, `.clearHistory()`, `.constructor()`, `.continueConversation()`, `.executeToolCalls()`, `.getDefaultSystemPrompt()`, `.setMemoryContext()`, `.setSystemPrompt()`, `HermesError`, `.constructor()`, `isMiniMaxConfigured()`, `minimax-hermes.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (9 nodes): `initJitsi()`, `leaveMeeting()`, `loadJitsi()`, `shareLink()`, `shareScreen()`, `toggleAudio()`, `toggleFullscreen()`, `toggleVideo()`, `JitsiRoom.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (8 nodes): `UserManagement.tsx`, `copyToClipboard()`, `fetchInvitations()`, `fetchUsers()`, `formatDate()`, `handleActivate()`, `handleInvite()`, `handleRevoke()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (8 nodes): `VideoCallPanel.tsx`, `copyLink()`, `createMeeting()`, `deleteMeeting()`, `endMeeting()`, `fetchAgendaActions()`, `fetchMeetings()`, `joinMeeting()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (5 nodes): `ChatButton()`, `handleKeyPress()`, `sendMessage()`, `toggleVoice()`, `PelayoChat.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (4 nodes): `buildContextSummary()`, `handleKeyPress()`, `sendMessage()`, `AIChat.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `checkAuth()`, `layout.tsx`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Community 0` to `Community 1`, `Community 2`, `Community 7`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 23`, `Community 25`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 1` to `Community 0`, `Community 3`, `Community 4`, `Community 9`, `Community 10`, `Community 13`, `Community 14`, `Community 22`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **Why does `DELETE()` connect `Community 0` to `Community 1`, `Community 5`?**
  _High betweenness centrality (0.104) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `GET()` (e.g. with `DELETE()` and `proxy()`) actually correct?**
  _`GET()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `POST()` (e.g. with `createAuthenticatedClient()` and `catch()`) actually correct?**
  _`POST()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `createAuthenticatedClient()` (e.g. with `proxy()` and `addMemory()`) actually correct?**
  _`createAuthenticatedClient()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Determina si el email es relevante para Alea Signature`, `Cargar último email procesado`, `Guardar último email procesado` to the rest of the system?**
  _23 weakly-connected nodes found - possible documentation gaps or missing edges._