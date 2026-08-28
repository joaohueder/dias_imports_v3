import { use } from "react";
import CompanyForm from "../new/page";

interface EditCompanyPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCompanyPage({ params }: EditCompanyPageProps) {
  const resolvedParams = use(params);
  return <CompanyForm companyIdProp={resolvedParams.id} />;
}
