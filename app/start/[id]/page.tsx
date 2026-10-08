import RoutineForm from '@/components/views/RoutineForm';
import { PLANS } from '@/lib/plans';

export function generateStaticParams(){
  return PLANS.map(p=>({ id:p.id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }){
  const { id } = await params;
  return <RoutineForm key={id} planId={id}/>;
}
