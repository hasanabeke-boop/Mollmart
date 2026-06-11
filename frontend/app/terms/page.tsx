"use client";

import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { useLanguage } from "@/context/LanguageContext";
import { getTermsDocument, legalUiLabels } from "@/lib/legalContent";

export default function TermsPage() {
  const { language } = useLanguage();
  const document = getTermsDocument(language);
  const labels = legalUiLabels[language] ?? legalUiLabels.en;

  return <LegalDocumentPage document={document} labels={labels} />;
}
