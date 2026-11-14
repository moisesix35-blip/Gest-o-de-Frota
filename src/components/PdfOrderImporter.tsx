import { parseRepresentativeOrder } from "./orderParsers";
import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export type ImportedOrder = {numero:string;cliente:string;documento:string;representante:string;uf:string;cidade:string;enderecoEntrega:string;nomeFantasia?:string;enderecoFaturamento?:string;bairroFaturamento?:string;cidadeFaturamento?:string;ufFaturamento?:string;cepFaturamento?:string;ufEntrega?:string;cepEntrega?:string;formaPagamento?:string;data:string;valor:string;telefone?:string;inscricaoEstadual?:string;cep?:string;bairro?:string;destinatarioEntrega?:string;bairroEntrega?:string;transportadora?:string;frete?:string;comprador?:string;tabelaUsada?:string;comissaoPercentual?:string;prazoPagamento?:string;cobranca?:string;observacoes?:string;tipoFrete?:"CIF"|"FOB";itens:OrderItem[]};
export type OrderItem = {codigo:string;descricao:string;cor:string;quantidade:string;unitario:string};
type QueueItem = {file:File; state:"pending"|"reading"|"review"|"done"|"error"; error?:string};
const empty: ImportedOrder = {numero:"",cliente:"",documento:"",representante:"",uf:"",cidade:"",enderecoEntrega:"",data:"",valor:"",itens:[]};
const match = (text:string, re:RegExp) => text.match(re)?.[1]?.trim() ?? "";
function parse(text:string): ImportedOrder {
 const lines=text.split(/\n/).map(x=>x.trim()).filter(Boolean);
 const get=(re:RegExp)=>match(text,re);
 const money=(s:string)=>s.replace(/R\$\s*/g,"").replace(/\./g,"").replace(",",".");
 const date=get(/(?:data(?:\s+de\s+emiss[aã]o)?|emiss[aã]o)\s*[:\-]?\s*(\d{2}\/\d{2}\/\d{4})/i);
 const itens:OrderItem[]=[];
 for(const line of lines) {
   // Reconhecimento conservador: somente linhas tabulares com código, descrição, cor, quantidade e preço.
   const m=line.match(/^(\d{3,})\s+(.{3,}?)\s{2,}([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s/-]{1,25})\s{2,}(\d+(?:[.,]\d+)?)\s{2,}([\d.,]+)(?:\s|$)/);
   if(m) itens.push({codigo:m[1],descricao:m[2].trim(),cor:m[3].trim(),quantidade:m[4],unitario:money(m[5])});
 }
 return {
  numero:get(/(?:n[º°o.]?\s*do\s*pedido|pedido\s*(?:n[º°o.]?)?|or[çc]amento\s*(?:n[º°o.]?)?)\s*[:#-]?\s*([\d-]{3,})/i),
  cliente:get(/(?:cliente|raz[aã]o\s+social)\s*:\s*([^\n]+)/i),
  documento:get(/(?:cnpj|cpf)\s*:\s*([\d./-]+)/i),
  representante:get(/(?:representante|vendedor)\s*:\s*([^\n]+)/i),
  uf:get(/\bUF\s*:\s*([A-Z]{2})\b/i),
  cidade:"",
  enderecoEntrega:"",
  data:date?date.split("/").reverse().join("-"):"",
  valor:money(get(/(?:valor\s+total|total\s+(?:geral|do\s+pedido))\s*:?\s*(?:R\$)?\s*([\d.,]+)/i)),
  itens
 };
}
export default function PdfOrderImporter({onConfirm,onClose,existingOrders}:{onConfirm:(order:ImportedOrder,file:File,tipo:string,atendimento:"Entrega"|"Coleta",alterarId?:string,financeiro?:"Aprovado"|"Pré-aprovado"|"Cancelado"|"Suspenso",operacao?:"novo"|"alteracao"|"assistencia"|"bonificacao"|"vpc")=>string|undefined;onClose:()=>void;existingOrders:{id:string;numero:string;cliente:string;documento:string;itens:OrderItem[]}[]}) {
 const [queue,setQueue]=useState<QueueItem[]>([]);
 const [index,setIndex]=useState(0);
 const [order,setOrder]=useState<ImportedOrder>(empty);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState("");
 const [documentType,setDocumentType]=useState("REPRESENTANTE");
 const [mode,setMode]=useState<"novo"|"alteracao"|"assistencia"|"bonificacao"|"vpc">("novo");
 const [target,setTarget]=useState("");
 const [financeiro,setFinanceiro]=useState<""|"Aprovado"|"Pré-aprovado"|"Cancelado"|"Suspenso">("");
 const [details,setDetails]=useState({telefone:"",inscricaoEstadual:"",cep:"",bairro:"",destinatarioEntrega:"",transportadora:"",frete:"",comprador:"",tabelaUsada:"",comissaoPercentual:"",prazoPagamento:"",cobranca:"",observacoes:""});
 const [atendimento,setAtendimento]=useState<""|"Entrega"|"Coleta">("");
 const current=queue[index];
 const read=async(file:File)=>{
  setBusy(true);setNotice("");
  try {
   const bytes=new Uint8Array(await file.arrayBuffer());
   const extension=file.name.split(".").pop()?.toLowerCase();
   const pages:string[]=[];
   const spreadsheetItems:OrderItem[]=[];
   if(extension==="xlsx"||extension==="xls"){
     const workbook=XLSX.read(bytes,{type:"array",cellDates:true});
     for(const sheetName of workbook.SheetNames){
       const sheet=workbook.Sheets[sheetName];
       const rows=XLSX.utils.sheet_to_json<(string|number|null)[]>(sheet,{header:1,defval:"",raw:false});
       pages.push(rows.map(row=>row.map(cell=>String(cell??"").trim()).join("  ")).join("\n"));
       const norm=(value:unknown)=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().trim();
       const headerIndex=rows.findIndex(row=>row.some(cell=>/DESCRICAO|PRODUTO/.test(norm(cell)))&&row.some(cell=>/QUANT|QTD/.test(norm(cell))));
       if(headerIndex>=0){
         const headers=rows[headerIndex].map(norm);
         const column=(re:RegExp)=>headers.findIndex(h=>re.test(h));
         const description=column(/DESCRICAO|PRODUTO/),color=column(/^COR$/),quantity=column(/QUANT|QTD/),unit=column(/UNIT|PRECO/),code=column(/COD/);
         for(const row of rows.slice(headerIndex+1)){
           const descricao=String(row[description]??"").trim();
           const quantidade=String(row[quantity]??"").trim();
           if(!descricao||!quantidade||/TOTAL|SUBTOTAL/i.test(descricao))continue;
           spreadsheetItems.push({codigo:code>=0?String(row[code]??""):"",descricao,cor:color>=0?String(row[color]??""):"",quantidade,unitario:unit>=0?String(row[unit]??"").replace(/R\$\s*/,"").trim():""});
         }
       }
     }
   }else if(extension==="docx"){
     const extracted=await mammoth.extractRawText({arrayBuffer:bytes.buffer as ArrayBuffer});
     pages.push(extracted.value);
   }else if(extension==="doc"){
     throw new Error("Word .doc antigo não é suportado. Salve o documento como .docx.");
   }else if(extension==="pdf"){
   const pdfjs=await import("pdfjs-dist");
   pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
   const pdf=await pdfjs.getDocument({data:bytes}).promise;
   for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);const text=await page.getTextContent();
    const rows=new Map<number,{x:number;s:string}[]>();
    for(const item of text.items) {
     if(!("str" in item))continue;
     const y=Math.round(item.transform[5]/3)*3;
     const arr=rows.get(y)||[];arr.push({x:item.transform[4],s:item.str});rows.set(y,arr);
    }
    pages.push([...rows.entries()].sort((a,b)=>b[0]-a[0]).map(([,v])=>v.sort((a,b)=>a.x-b.x).map(t=>t.s).join("  ")).join("\n"));
   }
   }else throw new Error("Formato não suportado. Use PDF, XLSX, XLS ou DOCX.");
   const text=pages.join("\n");
   if(!text.trim())throw new Error("Arquivo sem texto legível. PDFs digitalizados exigem OCR.");
   const result = parseRepresentativeOrder(text);
   if(spreadsheetItems.length)result.order.itens=spreadsheetItems;
   const get=(re:RegExp)=>text.match(re)?.[1]?.trim()||"";
   const fkn=result.template==="fkn-v1";
   const cidade=fkn?get(/CIDADE\.+:\s*(.*?)\s+ESTADO:/i):"";
   const endereco=fkn?(get(/ENTREGA\.:[^\n]*\n\s*:\s*(.*?)\s{2,}\//i)||get(/ENDEREÇO:\s*(.*?)\s{2,}\//i)):"";
   setOrder({...result.order,cidade,enderecoEntrega:endereco});
   setDetails({tabelaUsada:"",comissaoPercentual:"",telefone:fkn?get(/FONE\(s\):\s*([^\n/]+)/i):"",inscricaoEstadual:fkn?get(/INSC\.EST:\s*([^\s]+)/i):"",cep:fkn?get(/CEP\s*:\s*([\d-]+)/i):"",bairro:"",destinatarioEntrega:fkn?get(/ENTREGA\.:\s*([^\n]+)/i):"",transportadora:fkn?get(/TRANSP\.\.:\s*([^\n]+)/i):"",frete:"",comprador:fkn?get(/COMPRADOR:\s*([^\n]+)/i):"",prazoPagamento:fkn?get(/PRAZO PGTO\.:\s*(.*?)(?=\s{2,}FAT\.|\n)/i):"",cobranca:fkn?get(/COBRANÇA\.\.\.:\s*(.*?)(?=\s{2,}TABELA:|\n)/i):"",observacoes:fkn?get(/OBSERVAÇÕES:\s*([^\n]+)/i):""});
   setDocumentType(extension==="pdf"?(result.template==="fkn-v1"?"Oficial FKN":"REPRESENTANTE"):extension==="docx"?"WORD":"EXCEL");
   setQueue(q=>q.map((v,i)=>i===index?{...v,state:"review",error:undefined}:v));
   setNotice(result.warnings.join(" "));
  } catch(e) {
   const message=e instanceof Error?e.message:"Falha na leitura do PDF.";
   setQueue(q=>q.map((v,i)=>i===index?{...v,state:"error",error:message}:v));
   setNotice(message);
  } finally {setBusy(false);}
 };
 const add=(files:FileList|null)=>{
  if(!files)return;
  const incoming=Array.from(files).filter(f=>/\.(pdf|xlsx|xls|docx)$/i.test(f.name));
  setQueue(q=>[...q,...incoming.map(file=>({file,state:"pending" as const}))]);
 };
 const advance=()=>{setIndex(i=>i+1);setOrder(empty);setDetails({telefone:"",inscricaoEstadual:"",cep:"",bairro:"",destinatarioEntrega:"",transportadora:"",frete:"",comprador:"",tabelaUsada:"",comissaoPercentual:"",prazoPagamento:"",cobranca:"",observacoes:""});setNotice("");setAtendimento("");setMode("novo");setTarget("");setFinanceiro("");};
 const formatTotalBRL=(raw:string)=>{
   const cleaned=raw.replace(/[^\d,.]/g,"");
   if(!cleaned)return "";
   const comma=cleaned.lastIndexOf(",");
   const dot=cleaned.lastIndexOf(".");
   const numeric=comma>=0?Number(cleaned.replace(/\./g,"").replace(",",".")):dot>=0&&cleaned.length-dot-1===2?Number(cleaned):Number(cleaned.replace(/\./g,""));
   return Number.isFinite(numeric)?numeric.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):raw;
 };
 const set=(key:keyof Omit<ImportedOrder,"itens">,value:string)=>setOrder(v=>({...v,[key]:value}));
 const updateItem=(i:number,key:keyof OrderItem,value:string)=>setOrder(v=>({...v,itens:v.itens.map((it,j)=>i===j?{...it,[key]:value}:it)}));
 return <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 p-3 sm:p-7"><div className="mx-auto max-w-5xl rounded-xl bg-white p-5 shadow-xl sm:p-7">
  <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-bold">IMPORTAR PEDIDOS — PDF, EXCEL E WORD</h2><p className="mt-1 text-sm text-slate-500">Um arquivo por vez, sempre com confirmação do operador.</p></div><button aria-label="Fechar" onClick={onClose}><X size={20}/></button></div>
  <label className="mt-5 flex cursor-pointer items-center gap-2 rounded-lg border border-[#11984a] bg-green-50 p-4 text-sm font-semibold text-[#0b813e]"><Upload size={19}/> Selecionar arquivos PDF, Excel ou Word (individual ou em massa)<input type="file" accept=".pdf,.xlsx,.xls,.docx,application/pdf" multiple className="sr-only" onChange={e=>{add(e.target.files);e.target.value="";}}/></label>
  <p className="mt-2 text-xs text-amber-800">Leitura local de PDF com texto selecionável, Excel e Word (.docx). Sem OCR, sem armazenamento permanente e sem aprovação automática. Use somente documentos de teste.</p>
  {queue.length>0&&<div className="mt-5 grid gap-5 lg:grid-cols-[240px_1fr]">
   <aside className="space-y-2"><p className="text-xs font-bold uppercase text-slate-500">Fila ({queue.filter(q=>q.state==="done").length}/{queue.length} confirmados)</p>{queue.map((q,i)=><div key={i} className={`border-b border-slate-400 py-2 text-xs ${i===index?"border-green-500 bg-green-50":"border-slate-200"}`}><p className="break-all font-semibold">{i+1}. {q.file.name}</p><p className="mt-1 text-slate-500">{q.state==="pending"?"Aguardando":q.state==="reading"?"Lendo":q.state==="review"?"Conferência":q.state==="done"?"Confirmado":"Erro de leitura"}</p></div>)}</aside>
   <section className="min-w-0">
    {current ? <><p className="mb-1 text-xs font-bold">Pedido {index+1} de {queue.length}: {current.file.name}</p>
    {current.state==="pending"&&<button disabled={busy} onClick={()=>void read(current.file)} className="rounded-lg bg-[#11984a] px-4 py-2 text-sm font-semibold text-white">Ler este arquivo</button>}
    {current.state==="error"&&<button disabled={busy} onClick={()=>void read(current.file)} className="rounded-lg border px-4 py-2 text-sm">Tentar novamente</button>}
    {current.state==="review"&&<div className="space-y-2">
      <div className="space-y-1">
        <div className="border-b border-slate-400 py-2"><h3 className="mb-1 text-xs font-bold text-slate-800">Dados do pedido</h3><div className="grid gap-x-3 gap-y-1 sm:grid-cols-3">{([["numero","NÚMERO DO PEDIDO"],["data","DATA"],["representante","REPRESENTANTE"]] as const).map(([key,label])=><label key={key} className="text-xs font-semibold text-slate-600">{label}<input value={order[key]} onChange={e=>set(key,e.target.value)} type={key==="data"?"date":"text"} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm"/></label>)}</div></div>
        <div className="border-b border-slate-400 py-2"><h3 className="mb-1 text-xs font-bold text-slate-800">CLIENTE E ENTREGA</h3><div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-6"><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-3">RAZÃO SOCIAL<input value={order.cliente} onChange={e=>set("cliente",e.target.value.toLocaleUpperCase("pt-BR"))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-2">CNPJ / CPF<input value={order.documento} onChange={e=>set("documento",e.target.value.toLocaleUpperCase("pt-BR"))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-1">I.E.<input value={details.inscricaoEstadual} onChange={e=>setDetails(v=>({...v,inscricaoEstadual:e.target.value.toLocaleUpperCase("pt-BR")}))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-4">LOGRADOURO<input value={order.enderecoEntrega} onChange={e=>set("enderecoEntrega",e.target.value.toLocaleUpperCase("pt-BR"))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-2">BAIRRO<input value={details.bairro} onChange={e=>setDetails(v=>({...v,bairro:e.target.value.toLocaleUpperCase("pt-BR")}))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-3">CIDADE DE ENTREGA<input value={order.cidade} onChange={e=>set("cidade",e.target.value.toLocaleUpperCase("pt-BR"))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-1">ESTADO (UF)<input value={order.uf} onChange={e=>set("uf",e.target.value.toLocaleUpperCase("pt-BR"))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-1">CEP<input value={details.cep} onChange={e=>setDetails(v=>({...v,cep:e.target.value.toLocaleUpperCase("pt-BR")}))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-1">TELEFONE<input value={details.telefone} onChange={e=>setDetails(v=>({...v,telefone:e.target.value.toLocaleUpperCase("pt-BR")}))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label><label className="min-w-0 text-xs font-semibold text-slate-600 sm:col-span-6">DESTINATÁRIO DA ENTREGA<input value={details.destinatarioEntrega} onChange={e=>setDetails(v=>({...v,destinatarioEntrega:e.target.value.toLocaleUpperCase("pt-BR")}))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm uppercase"/></label></div></div>
        <div className="border-b border-slate-400 py-2"><h3 className="mb-1 text-xs font-bold text-slate-800">DADOS COMERCIAIS</h3><div className="grid gap-x-3 gap-y-1 sm:grid-cols-2 lg:grid-cols-4">{(["prazoPagamento","comprador","tabelaUsada","comissaoPercentual"] as const).map((key,i)=><label key={key} className="text-xs font-semibold text-slate-600">{["FORMA DE PAGAMENTO","COMPRADOR (OPCIONAL)","TABELA USADA","% COMISSÃO"][i]}<input value={details[key]} onChange={e=>setDetails(v=>({...v,[key]:e.target.value}))} className="mt-0.5 w-full rounded border border-slate-200 px-2 py-1 text-sm"/></label>)}</div></div>
      </div>
      <div className="grid grid-cols-1 gap-3 py-2 md:grid-cols-3"><label className="block min-w-0 text-sm font-semibold">OPERAÇÃO<select value={mode} onChange={e=>{setMode(e.target.value as "novo"|"alteracao"|"assistencia"|"bonificacao"|"vpc");setTarget("");}} className="mt-1 w-full rounded border p-2"><option value="novo">NOVO PEDIDO</option><option value="alteracao">ALTERAÇÃO DE PEDIDO</option><option value="assistencia">ASSISTÊNCIA</option><option value="bonificacao">BONIFICAÇÃO</option><option value="vpc">VPC</option></select></label><label className="block text-sm font-semibold text-slate-700">MODALIDADE DE FRETE *<select required value={atendimento} onChange={e=>setAtendimento(e.target.value as ""|"Entrega"|"Coleta")} className="mt-1 block w-full rounded-md border border-slate-300 p-2"><option value="">Selecione...</option><option value="Entrega">ENTREGA</option><option value="Coleta">COLETA</option></select></label>{mode!=="alteracao"&&<label className="block text-sm font-semibold text-slate-700">SITUAÇÃO FINANCEIRA *<select required value={financeiro} onChange={e=>setFinanceiro(e.target.value as typeof financeiro)} className="mt-1 block w-full rounded-md border border-slate-300 p-2"><option value="">Selecione...</option><option>APROVADO</option><option>PRÉ-APROVADO</option><option>CANCELADO</option><option>SUSPENSO</option></select><span className="mt-1 block text-xs font-normal text-slate-500">A aprovação financeira é independente da conferência do PDF e da etapa de produção.</span></label>}</div>
      {mode==="alteracao"&&<label className="mt-3 block text-sm font-semibold">Pedido original *<select value={target} onChange={e=>setTarget(e.target.value)} className="mt-1 w-full rounded border p-2"><option value="">Selecione e confira o pedido original</option>{existingOrders.map(p=><option key={p.id} value={p.id}>{p.numero} — {p.cliente}</option>)}</select></label>}{mode==="alteracao"&&<p className="mt-2 text-xs text-amber-800">O novo PDF deve representar o pedido completo atualizado. O sistema calculará a diferença em relação à versão anterior. Confira o vínculo antes de confirmar.</p>}
      <div className="flex items-center justify-between"><h3 className="font-bold">PRODUTOS</h3><button onClick={()=>setOrder(v=>({...v,itens:[...v.itens,{codigo:"",descricao:"",cor:"",quantidade:"",unitario:""}]}))} className="rounded-md border px-3 py-1.5 text-xs">+ Adicionar item</button></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] table-fixed text-xs"><colgroup><col style={{width:"40%"}}/><col style={{width:"15%"}}/><col style={{width:"12%"}}/><col style={{width:"15%"}}/><col style={{width:"15%"}}/><col style={{width:"3%"}}/></colgroup><thead><tr>{["DESCRIÇÃO","COR","QTD.","VLR. UNIT.","VLR. TOTAL",""].map(h=><th key={h} className="p-1 text-left">{h}</th>)}</tr></thead><tbody>{order.itens.map((item,i)=><tr key={i}>{(["descricao","cor","quantidade","unitario"] as const).map(k=><td key={k} className="p-1"><div className="relative">{k==="unitario"&&<span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500">R$</span>}<input aria-label={k+" item "+(i+1)} value={item[k]} onChange={e=>updateItem(i,k,e.target.value)} className={`w-full min-w-0 rounded border p-2 ${k==="unitario"?"pl-8":""}`}/></div></td>)}<td className="p-1"><input aria-label={"valor total item "+(i+1)} readOnly value={((Number(String(item.quantidade).replace(",","."))||0)*(Number(String(item.unitario).replace(",","."))||0)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})} className="w-full min-w-[90px] rounded border bg-slate-50 p-2" /></td><td><button aria-label="Remover item" onClick={()=>setOrder(v=>({...v,itens:v.itens.filter((_,j)=>j!==i)}))}><X size={15}/></button></td></tr>)}</tbody></table>{!order.itens.length&&<p className="py-4 text-xs text-amber-700">Nenhum item reconhecido. Adicione manualmente após conferir o PDF.</p>}</div>
      <div className="border-b border-slate-400 py-2"><div className="grid gap-x-3 gap-y-1 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">OBSERVAÇÕES<textarea value={details.observacoes} onChange={e=>setDetails(v=>({...v,observacoes:e.target.value}))} rows={2} className="mt-1 w-full rounded border p-2"/></label><label className="text-xs font-semibold text-slate-600">TOTAL GERAL (R$)<input inputMode="decimal" value={order.valor} onChange={e=>set("valor",e.target.value)} onBlur={()=>set("valor",formatTotalBRL(order.valor))} className="mt-1 w-full rounded border p-2" placeholder="R$ 0,00"/></label></div></div>
      <button onClick={()=>{if((!order.numero.trim()||!order.cliente.trim())&&mode==="novo"){setNotice("Confira número e cliente antes de confirmar.");return;}if(!atendimento){setNotice("Defina se este pedido é para entrega ou coleta.");return;}if(atendimento==="Entrega"&&(!order.cidade.trim()||!order.enderecoEntrega.trim())){setNotice("Informe a cidade e o endereço de entrega antes de confirmar.");return;}if(mode==="alteracao"&&!target){setNotice("Selecione o pedido original que receberá a alteração.");return;}if(mode!=="alteracao"&&!financeiro){setNotice("Defina a situação financeira inicial.");return;}const result=onConfirm({...order,...details},current.file,documentType,atendimento,mode==="alteracao"?target:undefined,financeiro||undefined,mode);if(result){setNotice(result);return;}setQueue(q=>q.map((v,i)=>i===index?{...v,state:"done"}:v));advance();}} className="rounded-lg bg-[#11984a] px-4 py-2.5 text-sm font-semibold text-white">Confirmar pedido e avançar</button>
    </div>}
    {notice&&<p role="alert" className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-900">{notice}</p>}
    </> : <div className="rounded-lg bg-green-50 p-6 text-sm font-semibold text-green-900">Fila finalizada. {queue.filter(q=>q.state==="done").length} pedido(s) confirmado(s) nesta sessão.</div>}
   </section>
  </div>}
 </div></div>;
}
