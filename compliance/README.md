# Compliance & Regulatory Grounding

Tessera is a fictional company, but its product logic, personas, and use cases should be grounded in the **real** compliance landscape that a cybersecurity/AI-driven third-party vendor risk platform would actually operate in. This doc is reference material for designing realistic pain points, features, and workflows — it is not legal advice and should not be treated as a compliance authority in itself.

**Jurisdictional scope**: EU, Canada, and the United States.

## 1. AI governance & risk

For how Tessera's own AI features trace to the two frameworks below, see the [AI compliance map](ai-compliance-map.html).

| Jurisdiction | Framework | Relevance to Tessera |
|---|---|---|
| EU | **EU AI Act** (Regulation 2024/1689) | Risk-tiered obligations for AI systems; Tessera's own AI features (risk scoring, document analysis, auto-flagging) may qualify as "high-risk" if used in ways that affect access to services — product needs transparency, human-oversight, and documentation features. |
| US | **NIST AI Risk Management Framework (AI RMF 1.0)** | Voluntary Govern/Map/Measure/Manage structure — a natural mental model for how Tessera's own AI risk-scoring features should be explainable and auditable. |
| US | State AI laws (e.g. **Colorado AI Act**, **NYC Local Law 144** on automated employment decisions) | Emerging patchwork of AI-specific disclosure/bias-testing obligations customers may ask Tessera to help track for their *own* AI-vendor exposure. |
| Canada | **Artificial Intelligence and Data Act (AIDA)**, part of Bill C-27 (proposed) | Bill C-27 lapsed in January 2025 and no federal AI statute is in force. Canadian customers will still expect Tessera to anticipate obligations for "high-impact" AI systems, incl. vendor AI systems. |

## 2. Cybersecurity

| Jurisdiction | Framework | Relevance to Tessera |
|---|---|---|
| EU | **NIS2 Directive** | Supply-chain security requirements — entities in scope must assess and monitor supplier/vendor cyber risk, directly mirroring Tessera's core use case. |
| EU | **DORA** (Digital Operational Resilience Act) | Financial-sector customers must maintain a register of ICT third-party providers and assess "critical" ICT vendors — a flagship use case for Tessera's financial-services segment. |
| US | **NIST Cybersecurity Framework (CSF) 2.0** | Common reference model customers use to categorize vendor risk findings (Identify/Protect/Detect/Respond/Recover/Govern). |
| US | **SEC cybersecurity disclosure rules** (2023) | Public companies must disclose material incidents, including those originating from third parties — creates urgency for continuous vendor monitoring. |
| US (sector) | **NYDFS 23 NYCRR 500** (as amended), **GLBA Safeguards Rule**, **HIPAA Security Rule** | Sector-specific rules requiring documented third-party service provider risk assessment programs. |
| Canada | **OSFI Guideline B-13** (Technology & Cyber Risk Management) | Federally regulated financial institutions must manage cyber risk from third parties. |

## 3. Privacy & data protection

| Jurisdiction | Framework | Relevance to Tessera |
|---|---|---|
| EU | **GDPR** | Art. 28 (processor obligations flow down to sub-processors/vendors), Art. 22 (automated decision-making — relevant to Tessera's own AI scoring), DPIA requirements for high-risk processing. |
| US | **CCPA/CPRA** (incl. draft ADMT regulations), **VCDPA, CPA, CTDPA** and other state privacy laws | Vendor/service-provider contractual flow-down obligations; increasing scrutiny of automated decision-making technology. |
| Canada | **PIPEDA**; **Quebec Law 25** | Cross-border data transfer and vendor accountability obligations Canadian customers must track for their vendors. |

## 4. Third-party / vendor risk management (TPRM) — most directly on-point

| Jurisdiction | Framework | Relevance to Tessera |
|---|---|---|
| EU | **DORA** register of information & critical ICT third-party provider oversight | Core inspiration for Tessera's vendor inventory + criticality tiering features. |
| EU | **NIS2** supply-chain risk management duties | Informs continuous-monitoring and incident-notification features. |
| US | **Interagency Guidance on Third-Party Relationships: Risk Management** (OCC/Fed/FDIC, 2023) | The primary US banking-sector TPRM standard — lifecycle model (planning, due diligence, contract, ongoing monitoring, termination) that Tessera's workflow should mirror. |
| US | **NIST SP 800-161** (Cybersecurity Supply Chain Risk Management) | Practical control catalog for assessing supplier/vendor risk. |
| Canada | **OSFI Guideline B-10** (Third-Party Risk Management) | Canadian-equivalent lifecycle guidance for regulated entities. |

## 5. Cross-jurisdictional standards vendors are typically assessed against

These are the artifacts Tessera's AI would realistically be ingesting/analyzing on behalf of customers:

- **ISO/IEC 27001** — information security management systems
- **ISO/IEC 27701** — privacy information management
- **ISO/IEC 42001** — AI management systems (increasingly requested of AI vendors)
- **SOC 2 Type II** (Trust Services Criteria) — most common vendor security attestation in the US
- **MITRE ATLAS** — adversarial threat landscape for AI systems
- **OWASP Top 10 for LLM Applications** — relevant when assessing vendors who themselves embed AI/LLMs

## How this should show up in the product

- **Personas**: Dana Vasquez and her analysts should have pain points tied to real obligations (e.g. "I need to prove to auditors we have an up-to-date DORA register of critical ICT vendors," "our AI vendors need to be assessed against the EU AI Act's high-risk criteria").
- **Use cases / prototypes**: Features like vendor criticality tiering, continuous monitoring, AI-assisted evidence review (SOC 2 reports, ISO certs), and audit-ready reporting should map back to a specific framework above.
- **AI transparency**: Because Tessera's own AI assists in risk decisions, its UI should reflect human-in-the-loop review, explainability, and audit trails — consistent with EU AI Act / NIST AI RMF expectations for high-risk AI use.
