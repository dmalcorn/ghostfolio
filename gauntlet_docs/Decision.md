# Domain Selection Decision

**Date:** 2026-02-23
**Decision:** Finance (Ghostfolio)

---

## Process

After completing the Pre-Search Checklist for both domains (Finance/Ghostfolio and Healthcare/OpenEMR), I reviewed each document thoroughly to evaluate which project I could execute most successfully within the week-long sprint.

## Evaluation Criteria

Both domains were viable candidates. My background spans both finance and healthcare, giving me the domain expertise needed for either path. The decision came down to which one resonated more strongly across multiple dimensions:

1. **Personal interest alignment** — Finance topics consistently engaged me more as I read through the checklist answers
2. **Competence overlap** — More of the finance checklist items mapped to areas where I have both interest and existing competence
3. **Success probability** — Since meeting all project deadlines is my top priority, I needed to choose the domain where I felt most confident in my ability to deliver

## Why Finance (Ghostfolio)

- **Existing AI infrastructure:** Ghostfolio already has OpenRouter + Vercel AI SDK integration, reducing the ramp-up time for a framework beginner
- **Cleaner integration path:** NestJS API endpoints are well-structured and ready to wrap as agent tools with minimal friction
- **Lower regulatory overhead:** While financial data is sensitive, it does not carry the same life-safety and HIPAA compliance burden as healthcare — allowing faster iteration during development
- **Stronger resonance:** As I worked through each section of the checklist, the finance use cases (portfolio analysis, market data, tax estimation) felt more natural and exciting to build

## Why Not Healthcare (OpenEMR)

This was not a rejection of the healthcare domain — it was a pragmatic decision:

- **Higher compliance bar:** HIPAA requirements, BAA with LLM providers, and PHI handling constraints add significant development overhead
- **Safety-critical stakes:** Drug interaction checking and clinical decision support require 100% accuracy on safety checks, which is harder to validate as a beginner with eval frameworks
- **More complex integration:** OAuth 2.0 / SMART on FHIR authentication, multiple medical coding systems (SNOMED, LOINC, ICD-10, CPT), and a PHP-based codebase requiring a separate Python agent service all add integration complexity
- **Longer path to MVP:** Given my beginner status with agent frameworks and testing, the healthcare domain's additional requirements would likely push the MVP deadline

## Risk Acknowledgment

- I am a beginner with agent frameworks — I will mitigate this by extending Ghostfolio's existing AI integration rather than introducing a new framework from scratch
- I am a beginner with eval/testing frameworks — I will start with simple assertion-based tests using Ghostfolio's existing Jest setup and build complexity incrementally
- My strong finance domain expertise will compensate for framework inexperience by enabling me to validate agent outputs effectively

## Conclusion

The finance domain offers the best combination of personal engagement, technical feasibility, and likelihood of meeting all project deadlines. Ghostfolio's existing infrastructure gives me a head start that aligns well with my current skill profile.
