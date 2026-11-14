import {useEffect,useRef,useState} from "react";
import TabelaPrecosOrganizada from "./TabelaPrecosOrganizada";
type RegraColuna={classificacao:"NACIONAL"|"NAO_CONFORME"|"TODOS";modalidade:"ENTREGA"|"COLETA"|"AMBAS";valorMinimo:number|null;valorMaximo:number|null};
type Row={modelo:string;cores:string;ipi:string;precos:number[]};
type Table={id:string;nome:string;regiao:string;faturamento:string;vigencia:string;versao:string;status:string;precos?:Row[];colunas?:string[];gruposColunas?:string[];coresCabecalhos?:Record<string,string>;titulosCabecalhos?:{principal:string;secundario:string};regrasColunas?:RegraColuna[];condicoes?:string[]};
export default function JanelaTabelaPrecos({tabela,onClose,isMaster,onChooseMaster,onEditPrice,onAddPrice,onDeletePrice,onSaveConditions,onSaveColumns,onRenameTable,produtos=[],tabelas=[]}:{tabela:Table;onClose:()=>void;isMaster:boolean;onChooseMaster:()=>void;onEditPrice?:(index:number,row:Row)=>void;onAddPrice?:(row:Row)=>void;onDeletePrice?:(index:number)=>void;onSaveConditions?:(conditions:string[])=>void;onSaveColumns?:(columns:string[],groups:string[],rules:RegraColuna[],colors:Record<string,string>,indices:number[],titles:{principal:string;secundario:string})=>void;onRenameTable?:(name:string)=>void;tabelas?:Table[];produtos?:{codigo:string;descricao:string;cores:string;ativo:boolean}[]}){
 const UFS=["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
 const [selectedUf,setSelectedUf]=useState("");
 const [ufOwner,setUfOwner]=useState<Record<string,string>>({});
 const getUfs=()=>{try{const rules=JSON.parse(localStorage.getItem("central-vaplast-tabelas-automacao-v1")||"{}");const today=new Date().toLocaleDateString("en-CA");const owners:Record<string,string>={};for(const uf of UFS){const explicit=Object.prototype.hasOwnProperty.call(rules.ufTable||{},uf)?rules.ufTable[uf]:undefined;const inferred=tabelas.find(t=>!(rules.directIds||[]).includes(t.id)&&!/(VENDA DIRETA|DIRETO)/i.test(t.nome)&&(t.regiao+" "+t.nome).toUpperCase().split(/[^A-Z]+/).includes(uf))?.id||"";owners[uf]=(rules.transfers||[]).filter((x:{uf:string;effective:string;reverted?:string})=>x.uf===uf&&!x.reverted&&x.effective<=today).reduce((id:string,x:{to:string})=>x.to,explicit===undefined?inferred:explicit);}return owners;}catch{return {} as Record<string,string>;}};
 useEffect(()=>{const refresh=()=>{setUfOwner(getUfs());};refresh();window.addEventListener("vaplast-uf-transfer-completed",refresh);window.addEventListener("vaplast-pricing-updated",refresh);return()=>{window.removeEventListener("vaplast-uf-transfer-completed",refresh);window.removeEventListener("vaplast-pricing-updated",refresh);};},[tabela.id,tabelas]);
 const requestUf=(uf:string,to:string)=>window.dispatchEvent(new CustomEvent("vaplast-request-uf-transfer",{detail:{uf,to}}));
 const currentUfs=UFS.filter(uf=>ufOwner[uf]===tabela.id);
 const availableUfs=UFS.filter(uf=>ufOwner[uf]!==tabela.id);
 const fields=[
  {key:"TIPO DE CLIENTE",label:"Tabela destinada a"},
  {key:"PRAZO PADRÃO",label:"Prazo padrão"},
  {key:"DESCONTO À VISTA",label:"% Desconto à vista"},
  {key:"DESCONTO COLETA",label:"% Desconto coleta"},
  {key:"LOGÍSTICA",label:"% Logística da Região"},
  {key:"PEDIDO MÍNIMO ENTREGA",label:"Pedido mínimo para entrega (R$)"},
  {key:"PEDIDO MÍNIMO COLETA",label:"Pedido mínimo para coleta (R$)"}
 ];
 const norm=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim();
 const aliases:Record<string,string[]>={
  "TIPO DE CLIENTE":["TIPO DE CLIENTE"],
  "PRAZO PADRÃO":["PRAZO PADRÃO","PRAZO LOJISTAS","PRAZO LOJISTA"],
  "DESCONTO À VISTA":["DESCONTO À VISTA","À VISTA LOJISTAS","À VISTA LOJISTA"],
  "DESCONTO COLETA":["DESCONTO COLETA","COLETA"],
  "LOGÍSTICA":["LOGÍSTICA","PERCENTUAL LOGÍSTICO"],
  "PEDIDO MÍNIMO ENTREGA":["PEDIDO MÍNIMO ENTREGA"],
  "PEDIDO MÍNIMO COLETA":["PEDIDO MÍNIMO COLETA"]
 };
 const matches=(line:string,key:string)=>{const title=norm(line.split(":")[0]||"");return (aliases[key]||[key]).some(x=>norm(x)===title);};
 const getLegacy=(key:string)=>{
  const line=(tabela.condicoes||[]).find(x=>matches(x,key));
  return line?line.slice(line.indexOf(":")+1).trim():"";
 };
 const extractMoney=(value:string)=>{const match=value.match(/R\$\s*([\d.,]+)/i);return match?match[1].replace(/\./g,"").replace(",","."):"";};
 const extractPercent=(value:string)=>{const match=value.match(/(\d+(?:[.,]\d+)?)\s*%/);return match?match[1].replace(",","."):"";};
 const getValue=(key:string)=>{
  const direct=getLegacy(key);
  if(key==="TIPO DE CLIENTE")return direct||(/ATACADISTA|REGIONAL|CIF \/ FOB/i.test(tabela.nome+" "+tabela.faturamento)?"Atacadista":/DISTRIBUIDOR|CREDIARIO/i.test(tabela.nome+" "+tabela.faturamento)?"Distribuidor":/CREDIARISTA/i.test(tabela.nome+" "+tabela.faturamento)?"Crediarista":"Lojista");
  if(key==="PRAZO PADRÃO")return direct.replace(/\s*DIAS?\b.*$/i,"").trim();
  if(key==="DESCONTO À VISTA"||key==="DESCONTO COLETA"||key==="LOGÍSTICA")return extractPercent(direct)||(key==="LOGÍSTICA"&&/\bTO\b|\bPA\b/i.test(tabela.regiao)?"15":"");
  if(key==="PEDIDO MÍNIMO ENTREGA")return direct||extractMoney(getLegacy("PRAZO PADRÃO"))||extractMoney(getLegacy("DESCONTO À VISTA"));
  if(key==="PEDIDO MÍNIMO COLETA")return direct||extractMoney(getLegacy("DESCONTO COLETA"));
  return direct;
 };
 const signature=(tabela.condicoes||[]).join("\n");
 const inferChannel=()=>{const saved=getLegacy("TIPO DE CLIENTE")||getLegacy("CANAL DE DISTRIBUIÇÃO");if(saved)return /ATACADISTA/i.test(saved)?"Atacadista":/DISTRIBUIDOR|CREDIARISTA/i.test(saved)?"Distribuidor / Crediário":"Lojista";const name=norm(tabela.nome+" "+tabela.faturamento);if(/CREDIARIO|DISTRIBUIDOR/.test(name))return "Distribuidor / Crediário";if(/REGIONAL|ATACADISTA|CIF \/ FOB/.test(name))return "Atacadista";return "Lojista";};
 const [channel,setChannel]=useState(inferChannel);
 const isRegional=channel==="Atacadista";
 const priceCount=tabela.colunas?.length??tabela.precos?.[0]?.precos?.length??0;
 const incompatible=false;

 const [editingConditions,setEditingConditions]=useState(false);
 const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(f=>[f.key,getValue(f.key)])));
 useEffect(()=>{setValues(Object.fromEntries(fields.map(f=>[f.key,getValue(f.key)])));setChannel(inferChannel());setEditingConditions(false);},[tabela.id,signature]);
 const percentageKeys=["DESCONTO À VISTA","DESCONTO COLETA","LOGÍSTICA"];
 const moneyKeys=["PEDIDO MÍNIMO ENTREGA","PEDIDO MÍNIMO COLETA"];
 const formatMoney=(raw:string)=>{const n=Number(raw.trim().replace(/\./g,"").replace(",","."));return raw.trim()&&Number.isFinite(n)?n.toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2}):raw;};
 const formatPercent=(raw:string)=>raw.trim()?raw.trim().replace(/%/g,"").replace(".",","):"";
 const saveConditions=()=>{
  if(!["Lojista","Crediarista","Distribuidor","Atacadista"].includes(values["TIPO DE CLIENTE"])){window.alert("Selecione o público da tabela.");return;}
  for(const key of percentageKeys){
   const raw=(values[key]||"").trim().replace(",",".").replace("%","");
   if(raw!==""&&(!/^\d+(?:\.\d+)?$/.test(raw)||Number(raw)>100)){window.alert("Informe "+key+" entre 0 e 100%.");return;}
  }
  for(const key of moneyKeys){
   const raw=(values[key]||"").trim().replace(/^R\$\s*/,"").replace(/\./g,"").replace(",",".");
   if(raw!==""&&(!/^\d+(?:\.\d{1,2})?$/.test(raw)||Number(raw)<0)){window.alert("Informe um valor válido para "+key+".");return;}
  }
  const preserved=(tabela.condicoes||[]).filter(line=>!fields.some(f=>matches(line,f.key))&&!["CREDIARISTA","DISTRIBUIDOR"].some(key=>matches(line,key))&&!matches(line,"CANAL DE DISTRIBUIÇÃO"));
  const changed=fields.flatMap(f=>{const raw=(values[f.key]||"").trim();const value=moneyKeys.includes(f.key)?raw.replace(/^R\$\s*/,"").replace(/\./g,"").replace(",","."):raw.replace(",",".").replace(/%$/,"");if(!value)return [];return [f.key+": "+(percentageKeys.includes(f.key)?value+"%":value)];});
  onSaveConditions?.([...preserved,...changed]);setChannel(values["TIPO DE CLIENTE"]==="Atacadista"?"Atacadista":values["TIPO DE CLIENTE"]==="Lojista"?"Lojista":"Distribuidor / Crediário");setEditingConditions(false);
 };
 const [editingColumns,setEditingColumns]=useState(false);
 const [columnDraft,setColumnDraft]=useState<string[]>([]);
 const [groupDraft,setGroupDraft]=useState<string[]>([]);
 const [columnSourceIndices,setColumnSourceIndices]=useState<number[]>([]);
 const [headerColors,setHeaderColors]=useState<Record<string,string>>({});
 const [headerTitles,setHeaderTitles]=useState({principal:"CABEÇALHO PRINCIPAL",secundario:"CABEÇALHO SECUNDÁRIO"});
 const [ruleDraft,setRuleDraft]=useState<RegraColuna[]>([]);
 const defaultRule=(group:string,label:string):RegraColuna=>({classificacao:/\bNC\b|NAO CONFORME/i.test(group+" "+label)?"NAO_CONFORME":/UNIF|NACIONAL/i.test(group+" "+label)?"NACIONAL":"TODOS",modalidade:/\bFOB\b|COLETA/i.test(group+" "+label)?"COLETA":/\bCIF\b|ENTREGA/i.test(group+" "+label)?"ENTREGA":"AMBAS",valorMinimo:null,valorMaximo:null});
 const updateRule=(i:number,patch:Partial<RegraColuna>)=>setRuleDraft(old=>old.map((rule,j)=>i===j?{...rule,...patch}:rule));
 const startColumnEdit=()=>{const count=tabela.colunas?.length??Math.max(0,...(tabela.precos||[]).map(p=>p.precos.length));setColumnDraft(Array.from({length:count},(_,i)=>tabela.colunas?.[i]??""));setGroupDraft(Array.from({length:count},(_,i)=>tabela.gruposColunas?.[i]||""));setRuleDraft(Array.from({length:count},(_,i)=>tabela.regrasColunas?.[i]||defaultRule(tabela.gruposColunas?.[i]||"",tabela.colunas?.[i]||"")));setHeaderColors({...tabela.coresCabecalhos});setHeaderTitles({principal:tabela.titulosCabecalhos?.principal||"CABEÇALHO PRINCIPAL",secundario:tabela.titulosCabecalhos?.secundario||"CABEÇALHO SECUNDÁRIO"});setColumnSourceIndices(Array.from({length:count},(_,i)=>i));setEditingColumns(true);};
 const deleteColumn=(index:number)=>{const source=columnSourceIndices[index];const hasPrices=source>=0&&(tabela.precos||[]).some(row=>(row.precos[source]||0)!==0);if(!window.confirm(hasPrices?"Esta coluna possui preços cadastrados. Excluí-la apagará esses valores. Deseja continuar?":"Excluir esta coluna e suas configurações?"))return;setColumnDraft(old=>old.filter((_,i)=>i!==index));setGroupDraft(old=>old.filter((_,i)=>i!==index));setRuleDraft(old=>old.filter((_,i)=>i!==index));setColumnSourceIndices(old=>old.filter((_,i)=>i!==index));};
 const deleteMainHeader=(group:string)=>{if(!window.confirm("Excluir o cabeçalho principal "+group+"? As colunas e seus preços serão mantidos, sem esse agrupamento."))return;setGroupDraft(old=>old.map(g=>g.trim().toUpperCase()===group?"":g));setHeaderColors(old=>{const next={...old};delete next[group];return next;});};
 const previewGroups=groupDraft.reduce<{name:string;span:number}[]>((acc,raw)=>{const name=raw.trim().toUpperCase();const last=acc[acc.length-1];if(last&&last.name===name)last.span++;else acc.push({name,span:1});return acc;},[]);
 const previewHeaderStyle=(group:string)=>{const bg=headerColors["__PRINCIPAL__"]||(/UNIF/i.test(group)?"#15803D":/\\bNC\\b/i.test(group)?"#EA580C":"#E2E8F0");const hex=/^#[0-9a-f]{6}$/i.test(bg)?bg:"#E2E8F0";const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return {backgroundColor:hex,color:r*.299+g*.587+b*.114>150?"#111827":"#FFFFFF"};};
 const saveColumns=()=>{if(columnDraft.some(x=>!x.trim())){window.alert("Informe o nome de cada coluna adicionada.");return;}if(ruleDraft.some(r=>r.valorMinimo!==null&&r.valorMaximo!==null&&r.valorMinimo>r.valorMaximo)){window.alert("O valor mínimo não pode ultrapassar o máximo.");return;}onSaveColumns?.(columnDraft.map(x=>x.trim().toUpperCase()),groupDraft.map(x=>x.trim().toUpperCase()),ruleDraft,headerColors,columnSourceIndices,{principal:headerTitles.principal.trim()||"CABEÇALHO PRINCIPAL",secundario:headerTitles.secundario.trim()||"CABEÇALHO SECUNDÁRIO"});setEditingColumns(false);};
 const [editingName,setEditingName]=useState(false);
 const [tableName,setTableName]=useState(tabela.nome);
 const saveName=()=>{const name=tableName.trim().replace(/\s+/g," ");if(!name||!onRenameTable)return;onRenameTable(name);setEditingName(false);};
 const [expanded,setExpanded]=useState(false);
 const [minimized,setMinimized]=useState(false);
 const [position,setPosition]=useState({x:0,y:0});
 const drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
 const start=(e:React.PointerEvent<HTMLDivElement>)=>{if(expanded||(e.target as HTMLElement).closest("button,input,select"))return;drag.current={x:e.clientX,y:e.clientY,left:position.x,top:position.y};e.currentTarget.setPointerCapture(e.pointerId);};
 const move=(e:React.PointerEvent<HTMLDivElement>)=>{if(!drag.current)return;setPosition({x:drag.current.left+e.clientX-drag.current.x,y:drag.current.top+e.clientY-drag.current.y});};
 const stop=()=>{drag.current=null;};
 return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 p-2 sm:p-5" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
  <div role="dialog" aria-modal="true" aria-label={"Tabela de preços "+tabela.nome} style={expanded?undefined:{transform:`translate(${position.x}px, ${position.y}px)`}} className={minimized?"flex w-80 flex-col overflow-hidden rounded-lg bg-white shadow-2xl":expanded?"flex h-full w-full flex-col overflow-hidden rounded-lg bg-white shadow-2xl":"flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"}>
   <div onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} className="flex cursor-move touch-none flex-wrap items-center justify-between gap-2 border-b bg-slate-50 px-4 py-3">
    <div className="min-w-0"><div className="flex items-center gap-2">{editingName?<><input aria-label="Nome da tabela" autoFocus className="min-w-48 max-w-md flex-1 rounded border border-green-600 bg-white px-2 py-1 text-sm font-semibold" value={tableName} maxLength={120} onChange={e=>setTableName(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveName();if(e.key==="Escape"){setTableName(tabela.nome);setEditingName(false);}}}/><button type="button" className="text-xs font-bold text-green-800" onClick={saveName}>SALVAR</button><button type="button" className="text-xs text-slate-600" onClick={()=>{setTableName(tabela.nome);setEditingName(false);}}>CANCELAR</button></>:<><h3 className="text-sm font-bold">{tabela.nome}</h3><button type="button" title="Editar nome da tabela" aria-label="Editar nome da tabela" onClick={()=>{setTableName(tabela.nome);setEditingName(true);}} className="rounded px-2 py-1 text-xs text-green-800 hover:bg-green-50">✎</button></>}</div><p className="text-xs text-slate-500">{tabela.regiao} · {tabela.faturamento} · V{tabela.versao} · Vigência {tabela.vigencia} · {tabela.status}</p></div>
    <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={!isMaster&&(!tabela.precos?.length||tabela.status!=="Publicada")} onClick={onChooseMaster} className={"rounded px-3 py-2 text-xs font-bold "+(isMaster?"bg-green-700 text-white":"border border-green-700 text-green-800 disabled:opacity-40")}>{isMaster?"✓ DETERMINANTE · RETIRAR":"DEFINIR DETERMINANTE"}</button><div className="flex items-center overflow-hidden bg-transparent text-green-800"><button type="button" title={minimized?"Restaurar janela":"Minimizar janela"} aria-label={minimized?"Restaurar janela":"Minimizar janela"} onClick={()=>setMinimized(v=>!v)} className="flex h-8 w-10 items-center justify-center text-base hover:bg-green-50">−</button><button type="button" title={expanded?"Restaurar tamanho":"Expandir janela"} aria-label={expanded?"Restaurar tamanho":"Expandir janela"} onClick={()=>{setMinimized(false);setExpanded(v=>!v);setPosition({x:0,y:0});}} className="flex h-8 w-10 items-center justify-center text-sm hover:bg-green-50">{expanded?"❐":"□"}</button><button type="button" title="Fechar janela" aria-label="Fechar janela" onClick={onClose} className="flex h-8 w-10 items-center justify-center text-lg hover:bg-red-50">×</button></div></div>
   </div>
   {!minimized&&<div className={expanded?"flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-5":"min-h-0 flex-1 overflow-y-auto p-3 sm:p-5"}><div className="mb-3 rounded-lg border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><div><p className="text-xs font-bold text-slate-700">COLUNAS E CONDIÇÕES DE PREÇOS</p><p className="mt-1 text-[11px] text-slate-500">Configure faixas, modalidade, classificação e limites de valor para cada coluna.</p></div><button type="button" className="rounded border border-green-700 px-3 py-2 text-xs font-bold text-green-800" onClick={()=>editingColumns?setEditingColumns(false):startColumnEdit()}>{editingColumns?"CANCELAR":"EDITAR COLUNAS"}</button></div>{editingColumns&&<div className="mt-3 space-y-3"><div className="max-h-72 space-y-2 overflow-y-auto">{columnDraft.map((name,i)=><div key={i} className="rounded border bg-slate-50 p-2"><div className="flex flex-wrap items-center gap-2"><input aria-label={"Nome da coluna "+(i+1)} className="min-w-36 flex-1 rounded border bg-white p-2 text-xs" placeholder="NOME DA COLUNA" value={name} onChange={e=>setColumnDraft(a=>a.map((x,j)=>j===i?e.target.value:x))}/><input aria-label={"Grupo da coluna "+(i+1)} className="w-28 rounded border bg-white p-2 text-xs" placeholder="GRUPO" value={groupDraft[i]||""} onChange={e=>setGroupDraft(a=>a.map((x,j)=>j===i?e.target.value:x))}/><button type="button" className="rounded border border-red-200 px-2 py-2 text-xs text-red-700" onClick={()=>deleteColumn(i)}>EXCLUIR</button></div><div className="mt-2 grid gap-2 sm:grid-cols-4"><label className="text-[10px] font-semibold">CLASSIFICAÇÃO<select className="mt-1 w-full rounded border bg-white p-2 text-xs" value={ruleDraft[i]?.classificacao||"TODOS"} onChange={e=>updateRule(i,{classificacao:e.target.value as RegraColuna["classificacao"]})}><option value="TODOS">TODOS</option><option value="NACIONAL">NACIONAL</option><option value="NAO_CONFORME">NÃO CONFORME</option></select></label><label className="text-[10px] font-semibold">MODALIDADE<select className="mt-1 w-full rounded border bg-white p-2 text-xs" value={ruleDraft[i]?.modalidade||"AMBAS"} onChange={e=>updateRule(i,{modalidade:e.target.value as RegraColuna["modalidade"]})}><option value="AMBAS">AMBAS</option><option value="ENTREGA">ENTREGA</option><option value="COLETA">COLETA</option></select></label>{(["valorMinimo","valorMaximo"] as const).map(key=><label key={key} className="text-[10px] font-semibold">{key==="valorMinimo"?"PEDIDO MÍN. (R$)":"PEDIDO MÁX. (R$)"}<input type="number" min="0" step="0.01" className="mt-1 w-full rounded border bg-white p-2 text-xs" value={ruleDraft[i]?.[key]??""} onChange={e=>updateRule(i,{[key]:e.target.value===""?null:Number(e.target.value)})}/></label>)}</div></div>)}</div><div className="flex flex-wrap justify-end gap-2"><button type="button" className="rounded border border-green-700 px-3 py-2 text-xs font-bold text-green-800" onClick={()=>{setColumnDraft(a=>[...a,""]);setGroupDraft(a=>[...a,""]);setRuleDraft(a=>[...a,defaultRule("","")]);setColumnSourceIndices(a=>[...a,-1]);}}>+ ADICIONAR COLUNA</button><button type="button" className="rounded bg-green-700 px-3 py-2 text-xs font-bold text-white" onClick={saveColumns}>SALVAR COLUNAS</button></div></div>}</div><TabelaPrecosOrganizada tabela={editingColumns?{...tabela,colunas:columnDraft,gruposColunas:groupDraft,coresCabecalhos:headerColors}:tabela} editable={!incompatible} expanded={expanded} onSave={onEditPrice} onAdd={onAddPrice} onDelete={onDeletePrice} produtos={produtos}/><details className="mt-4 shrink-0 rounded border p-3"><summary className="cursor-pointer text-xs font-bold">CONDIÇÕES COMERCIAIS</summary><div className="mt-3 grid gap-3 sm:grid-cols-3">
 {fields.map(f=><label key={f.key} className="text-xs font-semibold">{f.label}
 {f.key==="TIPO DE CLIENTE"?<select disabled={!editingConditions} className="mt-1 w-full rounded border border-slate-300 bg-white p-2 font-normal" value={values[f.key]||"Lojista"} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))}><option value="Lojista">Lojista</option><option value="Crediarista">Crediarista</option><option value="Distribuidor">Distribuidor</option><option value="Atacadista">Atacadista</option></select>:<div className="mt-1 flex w-full items-center overflow-hidden rounded border border-slate-300 bg-white font-normal">{moneyKeys.includes(f.key)&&<span className="pl-2 text-slate-600">R$</span>}<input className="min-w-0 w-full bg-transparent p-2 outline-none" value={moneyKeys.includes(f.key)&&!editingConditions?formatMoney(values[f.key]||""):percentageKeys.includes(f.key)?formatPercent(values[f.key]||""):(values[f.key]||"")} readOnly={!editingConditions} onChange={e=>setValues(v=>({...v,[f.key]:e.target.value}))} inputMode={percentageKeys.includes(f.key)||moneyKeys.includes(f.key)?"decimal":undefined} placeholder={f.key==="PRAZO PADRÃO"?"Ex.: 30/60/90":percentageKeys.includes(f.key)?"Ex.: 15":moneyKeys.includes(f.key)?"Ex.: 3000,00":"Informar condição"}/>{percentageKeys.includes(f.key)&&<span className="pr-3 text-slate-600">%</span>}</div>}
 </label>)}
 </div><div className="mt-3 flex gap-2">{editingConditions?<><button type="button" className="rounded bg-green-700 px-3 py-2 text-xs font-bold text-white" onClick={saveConditions}>SALVAR CONDIÇÕES</button><button type="button" className="rounded border px-3 py-2 text-xs" onClick={()=>{setValues(Object.fromEntries(fields.map(f=>[f.key,getValue(f.key)])));setEditingConditions(false);}}>CANCELAR</button></>:<button type="button" className="rounded border border-green-700 px-3 py-2 text-xs font-bold text-green-800" onClick={()=>setEditingConditions(true)}>EDITAR CONDIÇÕES</button>}</div>
 {(tabela.condicoes||[]).filter(line=>!fields.some(f=>matches(line,f.key))&&!["CREDIARISTA","DISTRIBUIDOR"].some(key=>matches(line,key))).length>0&&<div className="mt-3 border-t pt-2 text-xs text-slate-600">{(tabela.condicoes||[]).filter(line=>!fields.some(f=>matches(line,f.key))&&!["CREDIARISTA","DISTRIBUIDOR"].some(key=>matches(line,key))).map((line,i)=><p key={i}>{line}</p>)}</div>}</details></div>}
  </div>
 </div>;
}
