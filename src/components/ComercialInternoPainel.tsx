import type { Pedido } from "./PedidosPage";
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export default function ComercialInternoPainel({pedidos,onOpenPedidos}:{pedidos:Pedido[];onOpenPedidos:()=>void}){
 const approved=pedidos.filter(p=>p.financeiro==="Aprovado");
 const pre=pedidos.filter(p=>p.financeiro==="Pré-aprovado");
 const suspended=pedidos.filter(p=>p.financeiro==="Suspenso");
 const canceled=pedidos.filter(p=>p.financeiro==="Cancelado");
 const assist=pedidos.filter(p=>p.operacao==="assistencia");
 const recent=[...pedidos].sort((a,b)=>(b.data||"").localeCompare(a.data||"")).slice(0,8);
 return <section className="mx-auto max-w-6xl space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-orange-600">GESTÃO COMERCIAL / COMERCIAL INTERNO</p><h2 className="mt-1 text-2xl font-bold">Painel Comercial</h2><p className="mt-1 text-sm text-slate-500">Visão geral dos pedidos e das pendências comerciais.</p></div><button type="button" onClick={onOpenPedidos} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white">ABRIR PEDIDOS</button></div>
 <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900"><strong>Ambiente de desenvolvimento:</strong> pedidos e arquivos não são armazenados permanentemente. Os registros desaparecem ao atualizar a página. Não utilize dados reais ou sigilosos.</div>
 <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{[
 {label:"TOTAL DE PEDIDOS",orders:pedidos},
 {label:"APROVADOS",orders:approved},
 {label:"PRÉ-APROVADOS",orders:pre},
 {label:"SUSPENSOS",orders:suspended},
 {label:"CANCELADOS",orders:canceled},
 {label:"ASSISTÊNCIAS",orders:assist}
 ].map(item=><div key={item.label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-4"><p className="text-[11px] font-semibold text-slate-500">{item.label}</p><div className="mt-3 flex flex-wrap items-end justify-between gap-2"><div><p className="text-[10px] text-slate-500">QUANTIDADE</p><p className="text-2xl font-bold tabular-nums text-slate-900">{item.orders.length}</p></div><div className="min-w-0 text-right"><p className="text-[10px] text-slate-500">VALOR TOTAL</p><p className="break-words text-base font-bold tabular-nums text-green-800">{money(item.orders.reduce((sum,p)=>sum+p.valor,0))}</p></div></div></div>)}</div>
 <div className="grid gap-4 lg:grid-cols-3"><div className="rounded-xl border bg-white p-4 lg:col-span-2"><div className="flex items-center justify-between"><h3 className="text-sm font-bold">PEDIDOS RECENTES</h3><button type="button" onClick={onOpenPedidos} className="text-xs font-semibold text-green-700">VER TODOS</button></div>{recent.length?recent.map(p=><div key={p.id} className="flex flex-wrap justify-between gap-2 border-b py-3 text-xs"><div><strong>{p.numero} · {p.cliente}</strong><p className="mt-1 text-slate-500">{p.representante} · {p.data}</p></div><div className="text-right"><strong>{money(p.valor)}</strong><p className="mt-1 text-slate-500">{p.financeiro} · {p.status}</p></div></div>):<p className="py-8 text-center text-sm text-slate-500">Nenhum pedido registrado nesta sessão.</p>}</div><div className="rounded-xl border bg-white p-4"><h3 className="text-sm font-bold">ACOMPANHAMENTO</h3><p className="mt-3 text-xs text-slate-600">Use a seção <strong>Pedidos</strong> para importar arquivos, cadastrar pedidos e realizar a conferência comercial.</p><button type="button" onClick={onOpenPedidos} className="mt-4 rounded-lg border border-green-700 px-3 py-2 text-xs font-bold text-green-700">IR PARA PEDIDOS</button></div></div>
 <p className="text-xs text-amber-800">Painel demonstrativo: indicadores baseados nos pedidos temporários desta sessão. Valores não representam faturamento fiscal confirmado.</p></section>;
}