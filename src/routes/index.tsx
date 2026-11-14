import PedidosPage, { type Pedido } from "../components/PedidosPage";
import RepresentantePedidosPage from "../components/RepresentantePedidosPage";
import GestaoComercialPage from "../components/GestaoComercialPage";
import PrecificacaoProdutosPage from "../components/PrecificacaoProdutosPage";
import ComercialInternoPainel from "../components/ComercialInternoPainel";
import CargasPage, { type Load } from "../components/CargasPage";
import RotasCustosPage from "../components/RotasCustosPage";
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity, ArrowDownToLine, ArrowUpRight, Bell, Boxes, BriefcaseBusiness,
  CalendarDays, CheckCircle2, ChevronDown, ClipboardList, FileCheck2,
  FileText, Gauge, LayoutDashboard, Menu, Package, Plus, Search, Settings2,
  Truck, Users, Wallet, Wrench, X,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

const navigation = [
  { title: "Visão geral", items: [{ label: "Painel", icon: LayoutDashboard }] },
  { title: "Operação", items: [
    { label: "Cargas", icon: Boxes },
    { label: "Produção / PCP", icon: Package },
    { label: "Entregas e coletas", icon: ArrowDownToLine },
    { label: "Rotas e Custos", icon: Truck },
  ]},
  { title: "Gestão", items: [
    { label: "Gestão Comercial", icon: BriefcaseBusiness },
    { label: "Portal do Representante", icon: Users },
    { label: "Frota", icon: Truck },
    { label: "Manutenção", icon: Wrench },
    { label: "Viagens", icon: BriefcaseBusiness },
    { label: "Financeiro", icon: Wallet },
  ]},
  { title: "Sistema", items: [
    { label: "Relatórios", icon: Activity },
    { label: "Usuários e permissões", icon: Settings2 },
  ]},
];

const moduleDescriptions: Record<string, string> = {
  Pedidos: "Importação de PDFs, conferência dos dados e aprovação dos pedidos.",
  "Comercial Interno": "Recebimento, anexação e conferência de pedidos pela equipe comercial.",
  "Painel Comercial": "Indicadores e acompanhamento do setor comercial.",
  "Pedidos Comerciais": "Importação, cadastro e conferência de pedidos.",
  Cargas: "Montagem de cargas, vínculo de pedidos e acompanhamento da expedição.",
  "Rotas e Custos": "Controle do orçamento logístico e despesas reais por viagem.",
  "Produção / PCP": "Acompanhamento da produção e liberação das cargas prontas.",
  "Entregas e coletas": "Programação, ocorrências e confirmação das entregas e coletas.",
  "Gestão Comercial": "Cadastros de representantes, tabelas de preços, autorizações e comunicados.",
  "Precificação de Produtos": "Simulação de custos, despesas, margens e preços por produto.",
  "Portal do Representante": "Acompanhamento de pedidos, carteira de clientes e relatórios individuais.",
  Frota: "Cadastro de veículos, disponibilidade, documentos e quilometragem.",
  Manutenção: "Manutenções preventivas e corretivas, custos e alertas da frota.",
  Viagens: "Planejamento, execução e prestação de contas das viagens.",
  Financeiro: "Adiantamentos, despesas, comprovantes e acerto de viagens.",
  Relatórios: "Indicadores operacionais e relatórios por período.",
  "Usuários e permissões": "Contas individuais, perfis de acesso e trilha de auditoria.",
};

function Index() {
  const [active, setActive] = useState("Painel");
  const [commercialExpanded,setCommercialExpanded]=useState(false);
  const [internalExpanded,setInternalExpanded]=useState(true);
  const commercialSections=[{label:"Comercial Interno",section:"interno"},{label:"Representantes",section:"representantes"},{label:"Produtos",section:"produtos"},{label:"Tabelas de Preços",section:"tabelas"},{label:"Precificação de Produtos",section:"precificacao"},{label:"Autorizações",section:"autorizacoes"},{label:"Comunicados",section:"comunicados"}] as const;
  const commercialActive=active==="Gestão Comercial"||commercialSections.some(s=>s.label===active)||active==="Painel Comercial"||active==="Pedidos Comerciais";
  const [pendingAuthorizations,setPendingAuthorizations]=useState(0);
  useEffect(()=>{
    const refresh=()=>{
      try{
        const raw=localStorage.getItem("central-vaplast-gestao-comercial-demo-v1");
        const data=raw?JSON.parse(raw):{};
        setPendingAuthorizations(Array.isArray(data.autorizacoes)?data.autorizacoes.filter((a:{status?:string})=>a.status==="Pendente").length:0);
      }catch{setPendingAuthorizations(0);}
    };
    refresh();
    window.addEventListener("storage",refresh);
    window.addEventListener("focus",refresh);
    window.addEventListener("vaplast-commercial-updated",refresh);
    return ()=>{window.removeEventListener("storage",refresh);window.removeEventListener("focus",refresh);window.removeEventListener("vaplast-commercial-updated",refresh);};
  },[]);
  const [pedidos,setPedidos] = useState<Pedido[]>([]);
  const [cargas,setCargas] = useState<Load[]>([]);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginNotice, setLoginNotice] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Temporário: em desenvolvimento a tela de login fica oculta até o fim do projeto.
  const [devBypass, setDevBypass] = useState(false);
  const [search, setSearch] = useState("");
  const isDashboard = active === "Painel";

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-800">
      {!devBypass && <div className="fixed inset-0 z-[100] flex min-h-screen flex-col bg-[#f7f9f8] lg:flex-row">
        <section className="relative flex min-h-[300px] flex-col justify-between bg-[#102417] px-7 py-8 text-white sm:px-11 sm:py-11 lg:min-h-screen lg:w-1/2">
          <div className="absolute inset-x-0 top-0 h-[5px] bg-gradient-to-r from-[#fa4b0b] via-[#e4a32d] to-[#10994e]" />
          <p className="text-[11px] font-extrabold uppercase tracking-[.34em] text-[#ff551e]">CENTRAL DE CARGAS</p>
          <div className="my-12 max-w-[510px] lg:my-0">
            <h1 className="text-[clamp(30px,3.1vw,48px)] font-extrabold leading-[1.17] tracking-tight">Do pedido à entrega,<span className="mt-2 block text-[#fa4b0b]">tudo sob controle.</span></h1>
            <p className="mt-5 max-w-[425px] text-[14px] leading-6 text-[#a4b8aa]">Pedidos, conferência, cargas, coletas, viagens e prestação de contas em um só lugar.</p>
          </div>
          <p className="text-[11px] text-[#839c88]">VAPLAST · Nosso objetivo é o seu conforto.</p>
        </section>
        <section className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:w-1/2">
          <div className="w-full max-w-[345px]">
            <img src="https://vaplast.com.br/wp-content/uploads/2023/10/Logo_Oficial-Laranja_medio_1000-300x65.png" alt="Logotipo oficial Vaplast" className="mb-6 h-auto w-[170px] object-contain" />
            <h2 className="text-[21px] font-bold tracking-tight text-[#102417]">Entrar</h2>
            <p className="mt-1 text-[12px] text-slate-500">Use o e-mail e a senha fornecidos pelo administrador.</p>
            <form noValidate={import.meta.env.DEV} onSubmit={(e) => {e.preventDefault(); if (import.meta.env.DEV) { setDevBypass(true); return; } setLoginNotice(true);}} className="mt-6 space-y-5">
              <label className="block text-[13px] font-medium text-[#102417]">E-mail
                <input type="email" autoComplete="username" required value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} className="mt-1 block h-[34px] w-full rounded-md border border-[#d1d9d3] bg-transparent px-3 outline-none focus:border-[#159447] focus:ring-1 focus:ring-[#159447]" />
              </label>
              <label className="block text-[13px] font-medium text-[#102417]">Senha
                <input type="password" autoComplete="current-password" required value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} className="mt-1 block h-[34px] w-full rounded-md border border-[#d1d9d3] bg-transparent px-3 outline-none focus:border-[#159447] focus:ring-1 focus:ring-[#159447]" />
              </label>
              <button type="submit" className="h-[34px] w-full rounded-md bg-[#11984a] text-[13px] font-semibold text-white transition hover:bg-[#0c813d]">Entrar</button>
              {loginNotice && <p role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">A tela visual está pronta, mas a autenticação ainda precisa ser conectada ao serviço seguro de usuários. Nenhum acesso foi realizado.</p>}
            </form>
            <div className="mt-4">
                <button type="button" onClick={() => setDevBypass(true)} className="h-[34px] w-full rounded-md border border-dashed border-[#e4a32d] bg-amber-50 text-[13px] font-semibold text-amber-900 transition hover:bg-amber-100">Entrar sem login (modo de testes)</button>
                <p className="mt-2 text-[11px] leading-4 text-slate-500">Acesso temporário de demonstração, sem autenticação e sem dados reais. Não cria sessão nem concede permissões.</p>
              </div>
          </div>
        </section>
      </div>}
      {devBypass && <div className="fixed bottom-3 right-3 z-50 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-900 shadow-sm">Modo de testes · sem login</div>}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[258px] flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[76px] items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex min-w-0 flex-1 items-center"><img src="https://vaplast.com.br/wp-content/uploads/2023/10/Logo_Oficial-Laranja_medio_1000-300x65.png" alt="Vaplast" className="h-auto w-[174px] object-contain" /></div>
          <button onClick={() => setMobileOpen(false)} className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-slate-100 lg:hidden"><X size={18}/></button>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navigation.map((group) => <div key={group.title}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">{group.title}</p>
            <div className="space-y-1">{group.items.map(({label, icon: Icon}) => <div key={label}><button onClick={() => {if(label==="Gestão Comercial"){setCommercialExpanded(v=>!v);setActive("Painel Comercial");setInternalExpanded(true);}else{setActive(label);setMobileOpen(false);}}} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition ${(label==="Gestão Comercial"?commercialActive:active===label) ? "bg-[#fff1e5] text-[#b45309]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
              <Icon size={17} strokeWidth={1.8}/><span className="flex-1">{label}</span>{label==="Gestão Comercial"?<ChevronDown size={15} className={commercialExpanded?"rotate-180 transition-transform":"transition-transform"}/>:active===label&&<span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ea7a19]"/>}
            </button>{label==="Gestão Comercial"&&commercialExpanded&&<div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-2">{commercialSections.map(s=>s.section==="interno"?<div key={s.section}><button type="button" onClick={()=>{setInternalExpanded(v=>!v);setActive("Painel Comercial");}} className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs ${active==="Painel Comercial"||active==="Pedidos Comerciais"?"bg-green-50 font-semibold text-green-800":"text-slate-500 hover:bg-slate-50"}`}>Comercial Interno<ChevronDown size={13} className={internalExpanded?"rotate-180":""}/></button>{internalExpanded&&<div className="ml-3 border-l border-slate-200 pl-2">{[{label:"Painel",value:"Painel Comercial"},{label:"Pedidos",value:"Pedidos Comerciais"}].map(sub=><button key={sub.value} type="button" onClick={()=>{setActive(sub.value);setMobileOpen(false);}} className={`block w-full rounded-md px-3 py-2 text-left text-xs ${active===sub.value?"bg-green-50 font-semibold text-green-800":"text-slate-500 hover:bg-slate-50"}`}>{sub.label}</button>)}</div>}</div>:<button key={s.section} type="button" onClick={()=>{setActive(s.label);setMobileOpen(false);}} className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-xs ${active===s.label?"bg-green-50 font-semibold text-green-800":"text-slate-500 hover:bg-slate-50"}`}><span>{s.label}</span>{s.section==="autorizacoes"&&pendingAuthorizations>0&&<span aria-label={`${pendingAuthorizations} autorizações pendentes`} className="ml-auto inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-[10px] font-bold leading-none text-white">{pendingAuthorizations>99?"99+":pendingAuthorizations}</span>}</button>)}</div>}</div>)}</div>
          </div>)}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><ShieldIcon/> Vaplast · Ambiente interno</div><p className="mt-1.5 text-[11px] leading-5 text-slate-500">Acesso protegido por usuário e nível de permissão.</p></div>
          <div className="mt-3 flex items-center gap-2 px-1"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1e5] text-xs font-bold text-[#b45309]">AD</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">Administrador</p><p className="text-[10px] text-slate-400">Perfil de acesso</p></div><ChevronDown size={15} className="text-slate-400"/></div>
        </div>
      </aside>

      {mobileOpen && <button aria-label="Fechar menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"/>}
      <div className="min-h-screen lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu size={20}/></button><div><p className="text-[11px] font-medium text-slate-400">CENTRAL DE CARGAS / {isDashboard ? "INÍCIO" : active.toUpperCase()}</p><h1 className="mt-0.5 text-lg font-bold tracking-tight text-slate-900">{isDashboard ? "Painel de operações" : active}</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><div className="relative hidden md:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar no sistema..." className="h-9 w-56 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs outline-none transition focus:border-[#e7a15f] focus:bg-white"/></div><button aria-label="Notificações" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Bell size={18}/><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-orange-500"/></button><div className="hidden h-8 w-px bg-slate-200 sm:block"/><div className="hidden items-center gap-2 sm:flex"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffead6] text-xs font-bold text-[#b45309]">AD</div><span className="text-xs font-semibold text-slate-700">Administrador</span></div></div>
        </header>

        <main className="mx-auto max-w-[1440px] p-4 sm:p-7">
          {isDashboard ? <Dashboard onNavigate={setActive}/> : active === "Painel Comercial" ? <ComercialInternoPainel pedidos={pedidos} onOpenPedidos={()=>setActive("Pedidos Comerciais")}/> : (active === "Pedidos"||active === "Comercial Interno"||active === "Pedidos Comerciais") ? <PedidosPage pedidos={pedidos} setPedidos={setPedidos}/> : active === "Cargas" ? <CargasPage pedidos={pedidos} cargas={cargas} setCargas={setCargas}/> : active === "Rotas e Custos" ? <RotasCustosPage cargas={cargas} pedidos={pedidos}/> : active === "Produção / PCP" ? <ProductionExtracts pedidos={pedidos}/> : active === "Precificação de Produtos" ? <PrecificacaoProdutosPage/> : (active === "Gestão Comercial"||commercialSections.some(s=>s.label===active)) ? <GestaoComercialPage key={active} pedidos={pedidos} section={commercialSections.find(s=>s.label===active)?.section||"representantes"}/> : active === "Portal do Representante" ? <RepresentantePedidosPage pedidos={pedidos} setPedidos={setPedidos}/> : <ModulePage title={active} description={moduleDescriptions[active] ?? "Área de gestão do sistema."}/>}
          <footer className="mt-10 flex flex-col gap-1 border-t border-slate-200 py-5 text-[10px] text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>VAPLAST · CENTRAL DE CARGAS</span><span>Vaplast · Gestão integrada de operações</span></footer>
        </main>
      </div>
    </div>
  );
}


function ProductionExtracts({pedidos}:{pedidos:Pedido[]}) {
  const revisions=pedidos.flatMap(p=>(p.revisoes||[]).map((rev,i)=>({pedido:p,rev,i})));
  const printExtract=(pedido:Pedido,rev:NonNullable<Pedido["revisoes"]>[number])=>{
    const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]||ch));
    const html='<html><head><meta charset="utf-8"/><title>Extrato de alteração - '+escapeHtml(pedido.numero)+'</title><style>body{font-family:Arial,sans-serif;margin:36px;color:#172033}h1{font-size:20px}li{padding:12px 0;border-bottom:1px solid #ddd}p{font-size:13px}</style></head><body><h1>EXTRATO DE ALTERAÇÃO — PRODUÇÃO</h1><p><b>Pedido:</b> '+escapeHtml(pedido.numero)+' · '+escapeHtml(pedido.cliente)+'</p><p><b>Registrado:</b> '+escapeHtml(rev.data)+' · '+escapeHtml(rev.arquivo)+'</p><ul>'+rev.alteracoes.map(a=>'<li>'+escapeHtml(a)+'</li>').join('')+'</ul><p>Conferência da produção: ______________________________</p></body></html>';
    const win=window.open("","_blank");
    if(!win)return;
    win.document.write(html);win.document.close();win.focus();win.print();
  };
  return <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">EXTRATOS DE ALTERAÇÃO — PRODUÇÃO</h2><p className="mt-1 text-sm text-slate-500">Confira as alterações de pedidos e imprima os extratos somente neste módulo.</p>{!revisions.length?<p className="mt-5 text-sm text-slate-500">Nenhuma alteração de pedido registrada.</p>:<div className="mt-4 space-y-3">{revisions.map(({pedido,rev,i})=><div key={pedido.id+"-"+i} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">Pedido {pedido.numero} · {pedido.cliente}</p><p className="text-xs text-slate-500">{rev.data} · {rev.arquivo}</p></div><button type="button" onClick={()=>printExtract(pedido,rev)} className="rounded-lg bg-[#11984a] px-3 py-2 text-xs font-semibold text-white">Imprimir extrato</button></div><div className="mt-3 space-y-1">{rev.alteracoes.map((a,j)=><p key={j} className="border-t border-slate-100 py-2 text-sm">{a}</p>)}</div></div>)}</div>}</section>;
}

function ShieldIcon() {
  return <FileCheck2 size={15} className="text-[#ea7a19]"/>;
}

function Dashboard({onNavigate}: {onNavigate: (label: string) => void}) {
  const indicators = [
    {label:"Pedidos em análise", icon:FileText, note:"Aguardando conferência"},
    {label:"Cargas em andamento", icon:Boxes, note:"Montagem e programação"},
    {label:"Viagens em aberto", icon:Truck, note:"Em execução"},
    {label:"Acertos pendentes", icon:Wallet, note:"Aguardando financeiro"},
  ];
  const shortcuts = [
    {label:"Pedidos", detail:"Conferir documentos e pedidos", icon:ClipboardList},
    {label:"Montar carga", detail:"Vincular pedidos à expedição", icon:Boxes},
    {label:"Programar viagem", detail:"Planejar motorista e veículo", icon:Truck},
    {label:"Frota e manutenção", detail:"Consultar veículos e serviços", icon:Wrench},
  ];
  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm text-slate-500">Acompanhamento integrado da operação</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Visão geral</h2><p className="mt-1 text-sm text-slate-500">Resumo dos processos de pedidos, cargas, frota e viagens.</p></div><div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"><CalendarDays size={15} className="text-slate-400"/> Período: todos os registros</div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{indicators.map(({label,icon:Icon,note})=><div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.03)]"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{label}</span><span className="rounded-lg bg-slate-50 p-2 text-slate-500"><Icon size={17}/></span></div><div className="mt-4 text-2xl font-bold text-slate-300">—</div><p className="mt-1 text-[11px] text-slate-400">{note}</p></div>)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-900">Fluxo operacional</h3><p className="mt-1 text-xs text-slate-500">Etapas integradas da operação</p></div><Activity size={18} className="text-slate-400"/></div><div className="mt-6 grid gap-2 sm:grid-cols-5">{[{n:"01",t:"Pedidos",d:"Entrada e conferência"},{n:"02",t:"Cargas",d:"Montagem logística"},{n:"03",t:"Produção",d:"PCP e liberação"},{n:"04",t:"Viagens",d:"Entrega e execução"},{n:"05",t:"Financeiro",d:"Acerto e fechamento"}].map((step,i)=><div key={step.n} className="relative rounded-lg bg-slate-50 p-3"><div className="text-[10px] font-bold text-[#ea7a19]">{step.n}</div><p className="mt-2 text-xs font-bold text-slate-800">{step.t}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{step.d}</p>{i<4&&<ArrowUpRight size={13} className="absolute right-2 top-3 text-slate-300"/>}</div>)}</div><div className="mt-5 rounded-lg border border-dashed border-slate-200 px-4 py-3 text-xs leading-5 text-slate-500">Os indicadores serão preenchidos após a configuração do banco de dados e a entrada dos registros reais. Nenhum dado demonstrativo está sendo exibido.</div></section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-900">Atividade recente</h3><p className="mt-1 text-xs text-slate-500">Movimentações registradas no sistema</p></div><Bell size={17} className="text-slate-400"/></div><div className="flex min-h-[176px] flex-col items-center justify-center text-center"><div className="rounded-full bg-slate-50 p-3"><Activity size={20} className="text-slate-400"/></div><p className="mt-3 text-xs font-semibold text-slate-600">Nenhuma atividade registrada</p><p className="mt-1 max-w-[220px] text-[11px] leading-5 text-slate-400">O histórico aparecerá aqui conforme os usuários realizarem operações.</p></div></section>
    </div>
    <section><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-bold text-slate-900">Acesso rápido</h3><p className="mt-1 text-xs text-slate-500">Acesse as principais áreas de trabalho</p></div><span className="text-[10px] font-medium text-slate-400">MÓDULOS</span></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{shortcuts.map(({label,detail,icon:Icon})=><button key={label} onClick={()=>onNavigate(label==="Montar carga"?"Cargas":label==="Programar viagem"?"Viagens":label==="Frota e manutenção"?"Frota":label)} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#f2bd8a] hover:shadow-sm"><span className="rounded-lg bg-[#fff1e5] p-2.5 text-[#c96b12]"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-slate-800">{label}</span><span className="mt-1 block text-[10px] text-slate-500">{detail}</span></span><ArrowUpRight size={15} className="text-slate-300 transition group-hover:text-[#c96b12]"/></button>)}</div></section>
  </div>;
}

function ModulePage({title,description}: {title:string;description:string}) {
  return <div className="space-y-6"><div><p className="text-sm text-slate-500">Gestão integrada</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div><div className="rounded-xl border border-slate-200 bg-white p-8 sm:p-12"><div className="mx-auto flex max-w-lg flex-col items-center text-center"><div className="rounded-2xl bg-[#fff1e5] p-4 text-[#c96b12]"><Gauge size={26}/></div><h3 className="mt-5 text-base font-bold text-slate-900">Módulo preparado para configuração</h3><p className="mt-2 text-sm leading-6 text-slate-500">Esta área faz parte da estrutura da Central de Cargas. As telas operacionais, regras de negócio e conexão com o banco serão implementadas antes de liberar o uso com dados reais.</p><div className="mt-5 flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-[11px] font-medium text-orange-800"><Activity size={14}/> Não utilizar para lançamentos neste estágio</div></div></div></div>;
}
