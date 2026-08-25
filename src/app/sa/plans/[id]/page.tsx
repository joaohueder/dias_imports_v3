import PlanFormPage from "../new/page";

export default function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <PlanFormPage params={params} />;
}
