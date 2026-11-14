import {useMemo,useState} from "react";

type Referencia={modelo:string;variante:string;estadual:number;distribuidor:number;regional:number};
const referencias:Referencia[]=[
 {modelo:"Bromélia",variante:"Preto / Verde Cítrico / Verde Escuro / Vinho",estadual:57.95,distribuidor:48.70,regional:39.70},
 {modelo:"Tulipa",variante:"Preto / Verde Cítrico / Verde Escuro / Vinho",estadual:44.75,distribuidor:37.60,regional:30.50},
 {modelo:"Talísia",variante:"Cores da tabela",estadual:124.65,distribuidor:104.75,regional:86.95},
 {modelo:"Laélia",variante:"Cores da tabela",estadual:93.90,distribuidor:78.00,regional:65.50},
 {modelo:"Jatobá",variante:"Cores da tabela",estadual:123.90,distribuidor:104.10,regional:86.40},
 {modelo:"Cedro",variante:"Cores da tabela",estadual:102.50,distribuidor:86.15,regional:71.50},
 {modelo:"Mesa infantil Ipê",variante:"Cores, exceto preto",estadual:41.00,distribuidor:34.45,regional:28.60}
];
const moeda=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const num=(s:string)=>{const clean=s.trim().replace(/\s/g,"");return Number(clean.includes(",")?clean.replace(/\./g,"").replace(",","."):clean);};
const pct=(n:number)=>n.toFixed(2).replace(".",",");
type Regra={nome:string;desconto:string;faixa2:string;faixa3:string;nc:string};
const iniciais:Regra[]=[
 {nome:"Estadual 01 · TO/PA",desconto:"0",faixa2:"2",faixa3:"4",nc:"15"},
 {nome:"Estadual 02 · PI/MA/BA",desconto:"",faixa2:"",faixa3:"",nc:""},
 {nome:"Regional · CE/PB/PE/RN/AL",desconto:"",faixa2:"",faixa3:"",nc:""},
 {nome:"Crediário / Distribuidor",desconto:"",faixa2:"",faixa3:"",nc:""}
];
const input="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm";
export default function PrecificacaoEsboco(){
 const [modelo,setModelo]=useState("Cedro");
 const ref=useMemo(()=>referencias.find(x=>x.modelo===modelo)!,[modelo]);
 const [bases,setBases]=useState<Record<string,string>>(()=>Object.fromEntries(referencias.map(x=>[x.modelo,pct(x.estadual)])));
 const [regras,setRegras]=useState<Regra[]>(iniciais);
 const [faixa,setFaixa]=useState("1");
 const [linha,setLinha]=useState("UNIF");
 const [ipi,setIpi]=useState("3,25");
 const [incluirIpi,setIncluirIpi]=useState(false);
 const [vigencia,setVigencia]=useState("2026-08");
 const [aviso,setAviso]=useState("");
 const base=num(bases[modelo]||"");
 const validoBase=Number.isFinite(base)&&base>=0&&bases[modelo]?.trim()!=="";
 const atualizarRegra=(index:number,campo:keyof Regra,valor:string)=>setRegras(prev=>prev.map((r,i)=>i===index?{...r,[campo]:valor}:r));
 const calculo=(r:Regra)=>{if(!validoBase||!r.desconto.trim())return null;const campos=[r.desconto,faixa==="2"?r.faixa2:faixa==="3"?r.faixa3:"0",linha==="NC"?r.nc:"0"];if(campos.some(v=>!v.trim()||!Number.isFinite(num(v))||num(v)<0||num(v)>100))return null;let preco=base*(1-num(campos[0])/100)*(1-num(campos[1])/100)*(1-num(campos[2])/100);if(incluirIpi){if(!ipi.trim()||!Number.isFinite(num(ipi))||num(ipi)<0)return null;preco*=1+num(ipi)/100;}return Math.round((preco+Number.EPSILON)*100)/100;};
 const calibrar=(index:number,preco:number)=>{if(!validoBase||base<=0){setAviso("Informe um preço-base válido.");return;}const desconto=(1-preco/base)*100;if(desconto<0||desconto>100){setAviso("O preço histórico não permite calcular desconto positivo sobre esta base.");return;}atualizarRegra(index,"desconto",pct(desconto));setAviso("Percentual estimado a partir de dois preços históricos; valide com a responsável antes de aplicar.");};
 return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-base font-bold text-slate-900">MODELO DE PRECIFICAÇÃO · VAPLAST</h3><p className="mt-1 text-xs text-slate-600">Tabela-base → regras configuráveis → simulação → conferência → publicação futura</p></div><span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900">SIMULAÇÃO · NÃO PUBLICADO</span></div>
  <div className="grid gap-3 md:grid-cols-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold">1. PREÇO DE REFERÊNCIA</p><p className="mt-1 text-xs text-slate-600">A responsável informa o preço de cada modelo ou variante.</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold">2. REGRAS POR TABELA</p><p className="mt-1 text-xs text-slate-600">Desconto-base, faixa e linha NC, todos editáveis.</p></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-bold">3. CONFERÊNCIA</p><p className="mt-1 text-xs text-slate-600">Comparar com preços de agosto/2026 antes de aprovar.</p></div></div>
  <div className="rounded-lg border border-slate-200 p-3"><h4 className="text-xs font-bold">DADOS DA SIMULAÇÃO</h4><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
   <label className="text-xs font-semibold">PRODUTO / MODELO<select className={input} value={modelo} onChange={e=>setModelo(e.target.value)}>{referencias.map(x=><option key={x.modelo}>{x.modelo}</option>)}</select></label>
   <label className="text-xs font-semibold">PREÇO-BASE (R$)<input className={input} inputMode="decimal" value={bases[modelo]||""} onChange={e=>setBases(s=>({...s,[modelo]:e.target.value}))}/></label>
   <label className="text-xs font-semibold">LINHA<select className={input} value={linha} onChange={e=>setLinha(e.target.value)}><option>UNIF</option><option>NC</option></select></label>
   <label className="text-xs font-semibold">FAIXA<select className={input} value={faixa} onChange={e=>setFaixa(e.target.value)}><option value="1">Faixa 1</option><option value="2">Faixa 2</option><option value="3">Faixa 3</option></select></label>
  </div><p className="mt-2 text-xs text-slate-500">Referência inicial: Estadual 01 TO/PA, UNIF Faixa 1, agosto/2026. É uma hipótese de tabela-base, não uma regra confirmada. Variante: {ref.variante}.</p></div>
  <div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><h4 className="text-xs font-bold">REGRAS EDITÁVEIS POR TABELA</h4><button type="button" className="rounded border px-3 py-1.5 text-xs font-semibold" onClick={()=>{setRegras(iniciais);setAviso("Regras de simulação redefinidas.");}}>REDEFINIR REGRAS</button></div><p className="text-xs text-slate-600">Campos vazios = cálculo não configurado. Os percentuais iniciais da Estadual 01 são apenas exemplos para demonstrar o mecanismo.</p><div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-xs"><thead className="bg-slate-100"><tr><th className="p-2">TABELA</th><th className="p-2">DESCONTO BASE %</th><th className="p-2">FAIXA 2 %</th><th className="p-2">FAIXA 3 %</th><th className="p-2">NC %</th><th className="p-2">PREÇO SIMULADO</th></tr></thead><tbody>{regras.map((r,i)=><tr key={r.nome} className="border-b"><td className="p-2 font-semibold">{r.nome}</td>{(["desconto","faixa2","faixa3","nc"] as const).map(k=><td key={k} className="p-2"><input aria-label={r.nome+" "+k} className="w-20 rounded border px-2 py-1.5" inputMode="decimal" placeholder="—" value={r[k]} onChange={e=>atualizarRegra(i,k,e.target.value)}/></td>)}<td className="p-2 font-bold">{calculo(r)===null?"A configurar":moeda(calculo(r)!)}</td></tr>)}</tbody></table></div><p className="text-xs text-slate-500">Fórmula ilustrativa: preço-base × (1 − desconto-base) × (1 − desconto da faixa) × (1 − desconto NC). Os descontos são sucessivos, não somados. É necessário validar essa regra com a responsável.</p></div>
  <div className="rounded-lg border p-3"><h4 className="text-xs font-bold">COMPARAÇÃO COM AS TABELAS ENVIADAS</h4><p className="mt-1 text-xs text-slate-500">Valores históricos de agosto/2026, apenas UNIF Faixa 1; a Regional é CIF à vista e tem condições comerciais diferentes.</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{([{nome:"Estadual 01 · TO/PA",preco:ref.estadual,indice:0},{nome:"Crediário / Distribuidor",preco:ref.distribuidor,indice:3},{nome:"Regional CIF à vista",preco:ref.regional,indice:2}] as const).map(x=><div key={x.nome} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-600">{x.nome}</p><p className="mt-1 text-lg font-bold">{moeda(x.preco)}</p><button type="button" className="mt-2 rounded border border-green-700 px-2 py-1.5 text-xs font-semibold text-green-800" onClick={()=>calibrar(x.indice,x.preco)}>ESTIMAR DESCONTO BASE</button></div>)}</div><p className="mt-2 text-xs text-amber-800">Estimativas históricas não provam a fórmula real. A comparação direta entre tabelas com modalidades diferentes requer validação.</p></div>
  <div className="flex flex-wrap items-end gap-3 rounded-lg border p-3"><label className="text-xs font-semibold">VIGÊNCIA DE REFERÊNCIA<input type="month" className={input} value={vigencia} onChange={e=>setVigencia(e.target.value)}/></label><label className="text-xs font-semibold">IPI (%)<input className={input} inputMode="decimal" value={ipi} onChange={e=>setIpi(e.target.value)}/></label><label className="flex items-center gap-2 pb-2 text-xs font-semibold"><input type="checkbox" checked={incluirIpi} onChange={e=>setIncluirIpi(e.target.checked)}/> MOSTRAR PREÇOS COM IPI NA SIMULAÇÃO</label></div>
  {aviso&&<p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">{aviso}</p>}
  <p className="text-xs text-slate-500">Esboço sem gravação ou publicação: alterações se perdem ao sair da página. Não altera tabelas, pedidos ou preços autorizados. Faltam regras confirmadas de arredondamento, custo, frete, desconto à vista, coleta, mínimos e vínculo com SKU/cor.</p>
 </section>;
}
