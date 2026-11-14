# Central Compass — especificação funcional

## Objetivo
Construir uma central operacional integrada para pedidos, representantes, logística, produção/PCP, frota, viagens e financeiro. Todos os dados operacionais devem ser persistidos em banco de dados real, com autenticação individual, autorização no servidor e trilha de auditoria.

## Regras inegociáveis
- Não criar integração, API, sincronização ou conexão com FKN/SIFWin. Os PDFs oficiais FKN serão anexados manualmente.
- Não usar dados fictícios em indicadores ou telas operacionais.
- Não liberar lançamentos até autenticação, banco, permissões e persistência estarem implementados e testados.
- Preservar arquivos originais enviados, versões, usuário responsável e histórico de alterações.
- Não permitir que representantes visualizem dados de outros representantes ou módulos internos.
- Mudanças de schema do banco devem ser feitas pelo Lovable, não editando migrations manualmente neste repositório.
- Segredos e chaves ficam no gerenciador de Secrets do Lovable, nunca no código do navegador ou no Git.

## Regra de substituição do documento principal na finalização da produção
- O pedido inicial do representante é o documento operacional de entrada, conferência e montagem da carga.
- Ao concluir a produção, o operador anexa manualmente o PDF oficial FKN, utilizado como referência para faturamento/emissão de notas.
- A substituição é **lógica**: o PDF FKN torna-se o documento principal do pedido, mas o PDF do representante e suas versões permanecem preservados no histórico. Não sobrescrever ou excluir arquivos.
- Associar os documentos ao mesmo registro de pedido e manter identificadores distintos (número do orçamento do representante e número do pedido FKN).
- Comparar itens (código, descrição, cor, quantidade, preços), cliente e totais; sinalizar divergências e exigir confirmação do operador antes de marcar o documento FKN como principal.
- Atualizar as informações oficiais somente após confirmação, sem apagar as informações originalmente recebidas.
- Se o pedido já chegar em formato FKN, permitir entrada direta com esse documento, sem exigir PDF do representante.
- Não vincular automaticamente PDFs FKN a pedidos apenas por número semelhante; oferecer associação manual e checagem de duplicidade.
- A transição de documento principal não equivale à emissão de nota fiscal nem deve gerar faturamento automaticamente.
- Não integrar com FKN/SIFWin; PDF sempre anexado manualmente.

## Perfis e permissões
- ADMIN: acesso total, configuração e gestão de usuários.
- LOGÍSTICA: pedidos, cargas, entregas/coletas, frota e viagens conforme atribuições.
- COMERCIAL: carteira comercial e gestão dos representantes; sem administração geral ou acesso irrestrito aos demais setores.
- PRODUÇÃO/PCP: fila de produção, status, conclusão e liberação de cargas.
- FINANCEIRO: adiantamentos, despesas, comprovantes, conferência e fechamento de viagens.
- REPRESENTANTE: portal individual, próprios pedidos, status, pendências, correções de PDF, resultados comerciais e informações de entrega.
Aplicar autorização por função e escopo de registro no backend/RLS; ocultar botões no frontend não é controle de segurança suficiente.

## Módulos

### 1. Pedidos e leitura de PDFs
- Receber PDF do representante e PDF oficial FKN anexado manualmente.
- Importação individual e em lote, com fila e processamento independente por arquivo.
- Extrair cliente, pedido, produtos, quantidades, preços, descontos, pagamento, frete, totais, peso e volumes.
- Comparar os documentos lado a lado, inclusive item a item, sinalizando divergências.
- Detectar possíveis duplicidades.
- Permitir correção manual, reprocessamento e aprovação individual.
- Nenhum pedido é aprovado automaticamente.
- Guardar arquivo original, versões corrigidas, resultado da extração, divergências, responsável e datas.

### 2. Portal de representantes
- Login individual e isolamento dos dados por representante.
- Consultar somente seus pedidos, status, detalhes e pendências.
- Receber notificações e anexar PDF corrigido.
- Registrar vendas ganhas/perdidas e informações de entrega.
- Não acessar administração, financeiro, PCP, cargas ou viagens internas.

### 3. Cargas e logística
- Painel de cargas completas/incompletas, valores e filtros por data/mês.
- Montagem manual de carga e vínculo de pedidos, clientes e destinos.
- Permitir alocação parcial de pedido quando necessário, com controle de saldo e sem duplicar valores.
- Registrar coletas e seus status: aguardando agendamento, agendada e concluída.
- Status de carga: aguardando montagem, aguardando produção, aguardando faturamento, pronta para saída, em trânsito e concluída, conforme fluxo definido.
- Indicadores clicáveis devem abrir a lista que compõe o número.
- Registrar histórico de inclusão/remoção de pedidos e usuário responsável.
- Validar duplicidade de vínculo e capacidade de peso/volume quando os dados estiverem disponíveis.

### 4. Produção / PCP
- Receber cargas liberadas pela logística.
- Acompanhar itens e situação da produção.
- Registrar conclusão e responsável.
- Só permitir atribuir motorista e veículo depois de produção concluída e carga marcada como pronta.

### 5. Frota e manutenção
- Cadastro de veículos, placas, modelo, capacidade, quilometragem e documentos.
- Histórico de manutenções preventivas e corretivas, oficinas, datas, custos previstos e realizados, anexos e observações.
- Alertas por prazo e quilometragem.
- Bloquear seleção de veículo com manutenção impeditiva; manter disponibilidade e histórico.

### 6. Viagens
- Substituir o controle fragmentado da planilha VIAGENS_MOTORISTAS_2026 por registros relacionais.
- Planejar viagem a partir da carga: pedidos, clientes/destinos, motorista, veículo/placa, rota, quantidade de entregas, valor e datas previstas.
- Motorista e veículo só são obrigatórios após a liberação da carga.
- Registrar km inicial/final, horários reais, ocorrências e despesas.
- Despesas previstas: combustível, diárias, alimentação, descarga, pedágio, balsa, ICMS e outros.
- Permitir múltiplos adiantamentos e respectivos responsáveis.
- Registrar despesas realizadas individualmente, com comprovantes e observações.
- Fechamento compara previsão, adiantamentos e realizado; calcula saldo a devolver ou complementar.
- Financeiro revisa, aprova e encerra o acerto.
- Painéis de viagens em andamento, concluídas e com acerto pendente; custos por motorista, veículo, mês e ano.
- Parâmetros de custos por motorista/veículo devem ser configuráveis, nunca fixos no código.
- Viagens que cruzam meses devem ter quilometragem distribuída proporcionalmente ao período efetivamente rodado, com regra transparente e consistente.

### 7. Financeiro
- Registrar adiantamentos, despesas, comprovantes e acertos.
- Separar valor previsto, adiantado e realizado.
- Exigir revisão/aprovação antes do fechamento definitivo.
- Manter trilha de auditoria e histórico de alterações.

### 8. Relatórios e administração
- Filtros por período, cliente, representante, motorista, veículo, status e módulo.
- Exportação para Excel/PDF.
- Busca global, notificações e alertas de pendências/atrasos.
- Gestão de usuários, perfis, permissões e auditoria.

## Fluxo integrado esperado
1. Comercial/representante envia pedido e documentos.
2. Sistema extrai e compara os PDFs; usuário responsável corrige e aprova.
3. Logística monta a carga e vincula os pedidos.
4. PCP acompanha produção e registra a conclusão.
5. Carga pronta recebe motorista e veículo disponíveis.
6. Viagem é planejada, executada e encerrada com km, ocorrências e despesas.
7. Financeiro confere adiantamentos e comprovantes, aprova o acerto e fecha a viagem.
8. Registros permanecem disponíveis para consulta e relatórios.

## Sequência de implementação
1. Estrutura visual, navegação e identidade.
2. Banco de dados, autenticação, perfis, RLS e auditoria.
3. Cadastros básicos e portal de representantes.
4. Pedidos, armazenamento de PDFs, extração e comparação.
5. Cargas, logística, entregas/coletas e PCP.
6. Frota e manutenção.
7. Viagens, despesas, adiantamentos e fechamento financeiro.
8. Relatórios, notificações, testes de segurança e homologação.

## Dossiê operacional permanente e rastreabilidade ponta a ponta

**Regra obrigatória:** cada pedido recebe um ID interno imutável (UUID). Número do pedido do representante, número FKN, CNPJ/CPF, cliente, modalidade Entrega/Coleta e demais dados são atributos versionados, não identificadores primários. Alterações nunca devem destruir o valor anterior.

### Eventos e versões
- Registrar eventos de criação, importação, leitura, correção, aprovação, alteração, inclusão em carga, programação PCP, produção, anexo FKN, faturamento, expedição, entrega/coleta, ocorrências, retorno do motorista, prestação de contas e resolução.
- Cada evento registra data/hora, autor autenticado (quando autenticação estiver disponível), origem, motivo, estado anterior/novo, referências a documentos e entidades afetadas.
- Versionar campos comerciais, fiscais e operacionais: CNPJ/CPF, razão social, número do pedido, representante, produtos, cores, quantidades, preços, totais, endereço, pagamento, frete e atendimento. Registrar explicitamente alterações de CNPJ e de número, inclusive quando ocorrerem após início da produção.
- Preservar todos os PDFs originais, PDFs revisados, FKN oficial, extratos de alteração, notas fiscais, canhotos, fotos, comprovantes e evidências. Não substituir fisicamente arquivos nem permitir que uma revisão apague outra.
- Permitir vincular uma revisão ao pedido correto por ID e confirmação do operador; quando número ou CNPJ divergir, exigir validação explícita do vínculo. Não criar automaticamente outro pedido ou mudar CNPJ silenciosamente.
- Comparar revisão completa com a versão anterior e gerar extrato de diferenças para PCP; suportar também PDFs contendo somente alterações, mas exigir seleção explícita desse formato para evitar interpretar itens ausentes como excluídos.
- O registro de alteração deve refletir atualização do pedido e gerar pendência de ciência/execução para produção, inclusive para pedidos em andamento. Registrar recebimento e resolução da pendência.

### Expedição, entrega, retorno e ocorrências
- Associar pedidos a cargas, viagens, paradas, clientes, motorista, veículo e documentos de transporte.
- Registrar por item quantidade prevista, carregada, entregue, devolvida, recusada, faltante, avariada e pendente, sem presumir que quantidades são iguais.
- Ocorrências incluem tipo, pedido, item/código/cor, quantidade, cliente, data/hora, relato, fotos, comprovantes, responsável, providências, status e resolução.
- Exemplo: 100 cadeiras previstas, 99 entregues e 1 faltante; registrar a diferença de 1 unidade, preservar canhoto/foto e manter ocorrência consultável mesmo após solução.
- Registrar retorno do motorista (data/hora, km final, devoluções, canhotos, despesas e prestação de contas), sem encerrar automaticamente ocorrências abertas.
- Encerramento de viagem e resolução de ocorrências são processos distintos; histórico permanece disponível mesmo após conclusão.
- Busca no dossiê por ID interno, números antigos e novos, CNPJ antigo e novo, cliente, representante, carga, nota, viagem, motorista e data.
- Evitar exclusão física dos registros operacionais; correções são novos eventos, com justificativa e trilha de auditoria. Definir política de retenção e acesso conforme obrigações legais e LGPD.

### Dependências de implementação
- Este requisito **não está implementado** no protótipo atual: a interface ainda usa estado local temporário, sem persistência, autenticação ou auditoria.
- Implementar com banco de dados transacional, histórico append-only, versionamento de registros, armazenamento privado de arquivos e autorização no servidor antes de operar com dados reais.
- A autenticação pode ser a última etapa de experiência de usuário, mas segurança de dados e armazenamento privado são pré-requisitos para produção.
- Validar restauração de histórico, integridade referencial, trilhas de mudanças e permissões antes de ativar operação real.

## Aprovação financeira paralela à produção
- Na entrada de cada pedido (manual ou PDF, inclusive lote), o operador define obrigatoriamente a situação financeira inicial: Aprovado, Pré-aprovado, Cancelado ou Suspenso.
- A situação financeira é independente do status operacional do pedido, da conferência documental e do andamento da produção.
- Aprovado: pode seguir conforme fluxo operacional.
- Pré-aprovado: pode iniciar ou continuar produção, mas **não** pode ser faturado ou expedido até aprovação financeira definitiva.
- Suspenso: bloquear novas liberações e sinalizar imediatamente pedidos já em produção para análise/ação do PCP; não apagar trabalho já executado.
- Cancelado: bloquear continuidade, faturamento e expedição; registrar motivo, efeitos sobre itens já produzidos e histórico.
- Toda transição financeira exige justificativa, data/hora, autor e histórico de status anterior/novo. Com autenticação pendente, o protótipo não fornece autoria confiável.
- Mudanças financeiras não devem apagar versões de PDFs, itens, ocorrências ou eventos de produção.
- Na interface atual, classificação, filtros e histórico de teste estão implementados apenas em estado local; bloqueios operacionais, avisos ao PCP, persistência e controle de autorização dependem dos módulos integrados.

## Entrada semimanual multiformato e captura por câmera
- Disponibilizar entrada individual e em massa para PDF com texto, XML, Word (.docx), imagens JPG/PNG/WEBP/HEIC quando suportadas pelo navegador, digitalizações de scanner e fotos capturadas pela câmera do dispositivo.
- Para fotos, oferecer captura via input com `accept="image/*"` e `capture="environment"` em dispositivos compatíveis, com opção de selecionar arquivo existente; câmera depende de permissões e navegador.
- Processar cada arquivo da fila independentemente, permitindo revisão e correção dos campos antes de confirmar. Falha de um documento não deve interromper os demais.
- PDFs com texto: extração local; XML: parser estruturado com validação de origem/esquema, sem tratar qualquer XML como pedido válido; DOCX: extrair parágrafos e tabelas; imagens e PDFs digitalizados: OCR quando houver serviço seguro disponível, caso contrário apresentar prévia e preenchimento manual.
- Manuscritos: OCR/visão apenas como sugestão; nunca inventar texto, valores ou quantidades ilegíveis. Marcar campos de baixa confiança para revisão humana.
- Após leitura, operador confere cliente, CNPJ, número, representante, itens, cores, quantidades, preços, atendimento Entrega/Coleta e situação financeira. Nenhum pedido é criado ou alterado automaticamente sem confirmação.
- Preservar original, tipo MIME, nome, tamanho, origem (arquivo/scanner/câmera), resultado bruto da extração, correções do operador, data e usuário no dossiê persistente quando o backend seguro estiver implementado.
- Não executar XML como código, não buscar entidades externas, impor limites de tamanho e quantidade de páginas, e sanitizar dados antes da apresentação.
- No protótipo, não alegar OCR manuscrito ou armazenamento permanente sem implementação e testes.

## Critérios de aceite
- Dados continuam disponíveis após sair e entrar novamente.
- Usuário só acessa os registros e módulos autorizados, inclusive por acesso direto à API.
- Um representante não consegue consultar pedidos de outro.
- PDFs originais e versões ficam preservados.
- Falha ao processar um arquivo não interrompe o lote.
- Aprovação de pedido, liberação de carga e fechamento financeiro exigem usuário autorizado e geram auditoria.
- Não há valores duplicados em indicadores quando um pedido é dividido entre cargas.
- Não é possível atribuir veículo indisponível ou motorista/veículo antes da liberação da carga.
- Não há integração com FKN/SIFWin.
