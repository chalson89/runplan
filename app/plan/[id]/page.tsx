import PlanDetail from '@/components/views/PlanDetail';
import { PLANS } from '@/lib/plans';

export function generateStaticParams(){
  return PLANS.map(p=>({ id:p.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params;
  return <PlanDetail key={id} id={id}/>;
}
