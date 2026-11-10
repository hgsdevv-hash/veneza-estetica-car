# Gera o bloco do catálogo (preços do cliente, nov/2026) e injeta no index.html entre os marcadores.
# Uso: python src/catalogo.py
import html, re, pathlib

FIN = 'Finalização premium: limpeza de pneus, condicionador de pneus de alta performance e limpeza de emblemas e letras'
VAR30 = 'O valor pode variar em até 30%, conforme o tamanho do veículo e o verniz.'

POLIMENTO = [
    ('Polimento de repintura', 'Para pintura que precisa de recuperação mais profunda.', 3859.90, [
        'Lixamento técnico', 'Corte, refino e lustro', 'Proteção com vitrificador, de pelo menos 1 ano',
        'Revitalização de plásticos e vitrificação',
        FIN + ', com remoção de encardidos nos cantos (para-choque dianteiro, tampa traseira e laterais das portas, se houver)'], False),
    ('Polimento técnico completo', 'O mais completo: polimento detalhado em todo o carro, com vitrificação inclusa.', 1339.00, [
        'Polimento técnico premium em todas as laterais',
        'Polimento detalhado com mini politriz profissional, que alcança os cantinhos como maçanetas e entradas de porta',
        'Correção de riscos superficiais', 'Vitrificador na pintura, com proteção de pelo menos 6 meses a 1 ano',
        'Revitalização de plásticos e vitrificação',
        FIN + ', com remoção de encardidos nos cantos (para-choque dianteiro, tampa traseira e laterais das portas, se houver)'], True),
    ('Polimento técnico em 2 etapas', 'Corte e refino para tirar riscos e marcas.', 899.90, [
        'Polimento detalhado nas maçanetas das portas',
        'Limpeza de emblemas e remoção de encardidos em áreas localizadas, como cantos de borrachas, de letras e de emblemas',
        'Revitalização de plásticos com condicionador de plásticos',
        'Limpeza e higienização dos pneus, com condicionador de pneus', 'Proteção com selante, de 4 a 6 meses'], False),
    ('Polimento de refino', 'Mais brilho e uniformidade na pintura.', 699.90, [
        'Limpeza e higienização dos pneus', 'Condicionador de pneus de alta performance',
        'Proteção com selante sintético, de pelo menos 4 a 6 meses'], False),
    ('Polimento comercial', 'Somente o polimento comercial. Sem detalhamento.', 528.90, [
        'Limpeza e higienização dos pneus', 'Proteção com cera de carnaúba, de pelo menos 3 meses'], False),
]
POL_INFO = [
    'O polimento corrige riscos leves e superficiais. Riscos profundos, que passam do verniz, podem ficar menos visíveis, mas não desaparecem só com polimento.',
    'O resultado depende do estado da pintura. Pintura muito desgastada, com pouco verniz ou com repintura mal feita pode limitar o resultado. Avaliamos o carro antes e avisamos no orçamento.',
    'O tempo de proteção (cera, selante ou vitrificador) é uma estimativa e não é garantia. Ele depende de sol, chuva, tipo de lavagem e cuidados com o carro.',
    'Para a proteção durar mais, lave o carro com shampoo neutro e evite produtos fortes.',
    'O valor final é confirmado no orçamento, conforme o tamanho e o estado do carro.',
]
VITRI = [
    ('Sonax Profiline CC36', 'Durabilidade: até 3 anos, com revisão anual', 'Manutenção com selante sintético: só a cada 6 meses (2 vezes por ano). A 1ª manutenção está inclusa no pacote.', 2100.00, True),
    ('Ceramic Pro', 'Durabilidade: de 2 a 5 anos, conforme o número de camadas', 'Manutenção com selante sintético: a cada 3 a 6 meses', 1890.00, False),
    ('Carpro CQuartz', 'Durabilidade: até 2 anos', 'Manutenção com selante sintético: a cada 3 a 6 meses', 1790.00, False),
    ('Gyeon Q² Mohs', 'Durabilidade: de 2 a 3 anos', 'Manutenção com selante sintético: a cada 3 a 6 meses', 1590.00, False),
    ('Vonixx V-Paint', 'Durabilidade: até 2 anos', 'Manutenção com selante sintético: a cada 30 a 45 dias', 850.00, False),
    ('Alcance VX45', 'Durabilidade: até 3 anos', 'Manutenção com selante sintético: a cada 2 a 3 meses', 690.00, False),
    ('Vonixx Sinergy Paint', 'Durabilidade: até 12 meses', 'Manutenção com selante sintético: a cada 45 dias', 450.00, False),
]
MANUT = [
    ('Manutenção simples', 250.00, ['Lavagem detalhada', 'Selante sintético para vitrificação', FIN]),
    ('Manutenção completa', 370.00, ['Lavagem detalhada', 'Descontaminação leve, se precisar', 'Selante sintético para vitrificação', FIN]),
]
VIT_INFO = [
    'O valor final é confirmado no orçamento, conforme o tamanho e o estado do carro.',
    'O tempo de proteção é uma estimativa e não é garantia. Ele depende do produto, do sol, da chuva e dos cuidados com o carro.',
    'A manutenção periódica com selante sintético para vitrificação mantém o brilho, a repelência à água e a duração da proteção. Sem a manutenção, o tempo de proteção pode ser menor.',
    'No Sonax Profiline CC36, a 1ª manutenção está inclusa no pacote. Nos demais vitrificadores, a manutenção é cobrada à parte.',
    'Para a proteção durar mais, lave o carro com shampoo neutro e evite produtos fortes.',
]
HIGI = [
    ('Higienização premium', 'O pacote mais completo, com vitrificação de plásticos.', 589.90, [
        'Tudo da higienização completa', 'Higienização do teto e do porta-malas', 'Hidratação dos bancos de couro, se houver',
        'Vitrificação de plásticos', FIN], True),
    ('Higienização completa', 'Limpeza profunda dos bancos e carpetes.', 389.90, [
        'Tudo da higienização básica', 'Higienização dos bancos', 'Higienização dos carpetes', FIN], False),
    ('Higienização básica', 'Limpeza geral do interior do carro.', 249.90, [
        'Aspiração completa', 'Limpeza de painel, portas e console', 'Limpeza dos vidros internos', 'Limpeza dos tapetes', FIN], False),
]
HIG_INFO = [
    'O valor pode ser alterado em até 45%, dependendo da avaliação do profissional e do estado do veículo.',
    'O valor final é confirmado no orçamento, conforme o tamanho do veículo e o nível de sujeira.',
    'Manchas antigas e odores muito fortes podem não sair por completo. Avaliamos o carro antes e avisamos no orçamento.',
]
FAROIS = [
    ('Faróis com amarelamento leve', 'leve', [('Restauração com polimento', 250.00), ('Restauração com verniz de polímero', 259.90), ('Restauração com vitrificação', 297.90)]),
    ('Faróis craquelados', 'craquelados', [('Restauração com polimento', 449.90), ('Restauração com verniz de polímero', 499.00), ('Restauração com vitrificação', 539.90)]),
]
FAR_INFO = [
    'O valor final é confirmado no orçamento, conforme o estado dos faróis.',
    'O tempo de duração do resultado é uma estimativa e não é garantia. Ele depende do sol, da chuva e dos cuidados com o carro.',
]
ADIC = [
    ('Remoção de chuva ácida', 'Em todos os vidros', 250.00),
    ('Cristalização de vidros', 'Proteção que dura em média de 2 a 3 meses', 150.00),
    ('Combo: remoção de chuva ácida + cristalização', 'Você economiza R$ 100,00 em relação a contratar separado', 300.00),
]
ADI_INFO = [
    'A remoção de chuva ácida limpa as marcas que já estão no vidro. Ela não é uma proteção, e novas marcas podem aparecer com chuva, sol e água dura.',
    'A cristalização dura em média de 2 a 3 meses. Pode durar menos se o carro ficar muito exposto ao sol, se o limpador de para-brisa for muito usado, em chuvas fortes ou com lavagens feitas com produtos fortes.',
    'No combo, a remoção limpa e a cristalização protege, para as marcas não voltarem tão rápido.',
    'Riscos e microrriscos que já existem no vidro, principalmente onde a palheta do limpador passa, podem ficar mais visíveis depois da limpeza. Avisamos no orçamento.',
    'Os prazos de duração são estimativas e não são garantia, porque dependem do uso e dos cuidados com o carro.',
]
PACOTES = [
    ('Pacote Essencial', False, [('Polimento comercial', 528.90), ('Vitrificação Vonixx Sinergy Paint', 450.00), ('Higienização básica', 249.90), ('Faróis (amarelamento leve), polimento', 250.00)]),
    ('Pacote Intermediário', False, [('Polimento de refino', 699.90), ('Vitrificação Alcance VX45', 690.00), ('Higienização completa', 389.90), ('Faróis (amarelamento leve), verniz de polímero', 259.90)]),
    ('Pacote Premium', True, [('Polimento técnico em 2 etapas', 899.90), ('Vitrificação Sonax Profiline CC36', 2100.00), ('Higienização premium', 589.90), ('Faróis craquelados, vitrificação', 539.90)]),
]

e = html.escape
def brl(v):
    s = f'{v:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    return 'R$ ' + s
def ag(svc):
    return f'<button type="button" class="ag" data-svc="{e(svc)}">Agendar</button>'
def info(title, items):
    lis = ''.join(f'<li>{e(i)}</li>' for i in items)
    return f'<details class="info"><summary>{e(title)}</summary><ul>{lis}</ul></details>'
def item(name, desc, price, bullets, hot=False, svc=None, extra=''):
    ul = ('<ul>' + ''.join(f'<li>{e(b)}</li>' for b in bullets) + '</ul>') if bullets else ''
    d = f'<small>{e(desc)}</small>' if desc else ''
    return (f'<div class="it{" hot" if hot else ""}"><div class="it-txt"><b>{e(name)}</b>{d}{ul}{extra}</div>'
            f'<div class="it-pr"><span class="pr">{brl(price)}</span>{ag(svc or name)}</div></div>')

out = []
# polimento
out.append('<div class="panel" id="p-polimento" role="tabpanel" aria-labelledby="t-polimento">')
out.append('<div class="box"><h3>Polimento <small>Do mais completo ao mais simples</small></h3>')
for n, d, p, b, hot in POLIMENTO:
    out.append(item(n, d, p, b, hot))
out.append(f'<p class="var">{e(VAR30)}</p></div>')
out.append('<div class="verniz"><h3>Verniz macio e verniz duro</h3><p>O verniz é a camada transparente que protege a cor da pintura. Cada fabricante usa um verniz diferente, e isso muda o trabalho de polimento.</p>'
           '<div class="vz2"><div><b>Verniz macio</b><em>Exemplo: Honda Civic.</em><p>Em geral, risca com mais facilidade e fica com microriscos de lavagem. Em compensação, é mais rápido de polir e responde bem ao polimento.</p></div>'
           '<div><b>Verniz duro</b><em>Exemplo: BMW.</em><p>Em geral, resiste melhor a riscos e a manchas. Em compensação, o polimento é mais demorado e exige mais corte e mais cuidado para remover as marcas.</p></div></div>'
           '<p>Por isso o valor pode variar em até 30% conforme o verniz do carro. Essa é uma regra geral, e cada modelo e ano pode ter diferenças. Avaliamos o seu carro antes de fechar o orçamento.</p></div>')
out.append(info('Informações importantes sobre os polimentos', POL_INFO))
out.append('</div>')
# vitrificação
out.append('<div class="panel" id="p-vitrificacao" role="tabpanel" aria-labelledby="t-vitrificacao" hidden>')
out.append('<div class="box"><h3>Vitrificação <small>Valor da aplicação</small></h3>')
for n, dur, man, p, hot in VITRI:
    out.append(item(n, dur, p, [man], hot, svc='Vitrificação: ' + n))
out.append('</div>')
out.append('<div class="box"><h3>Manutenção da vitrificação <small>Com selante sintético</small></h3>')
for n, p, b in MANUT:
    out.append(item(n, '', p, b, svc='Manutenção de vitrificação: ' + n.split()[-1]))
out.append('</div>')
out.append(info('Informações importantes sobre a vitrificação', VIT_INFO))
out.append('</div>')
# higienização
out.append('<div class="panel" id="p-higienizacao" role="tabpanel" aria-labelledby="t-higienizacao" hidden>')
out.append('<div class="box"><h3>Higienização <small>Todas com finalização premium</small></h3>')
for n, d, p, b, hot in HIGI:
    out.append(item(n, d, p, b, hot))
out.append('<p class="var">O valor pode ser alterado em até 45%, dependendo da avaliação do profissional e do estado do veículo.</p></div>')
out.append(info('Informações importantes sobre a higienização', HIG_INFO))
out.append('</div>')
# faróis
out.append('<div class="panel" id="p-farois" role="tabpanel" aria-labelledby="t-farois" hidden>')
for title, key, opts in FAROIS:
    out.append(f'<div class="box"><h3>{e(title)} <small>O par</small></h3>')
    for n, p in opts:
        acab = n.replace('Restauração com ', '')
        out.append(item(n, '', p, [], svc=f'Faróis ({"amarelamento leve" if key == "leve" else "craquelados"}): {acab}'))
    out.append('</div>')
out.append(info('Informações importantes sobre os faróis', FAR_INFO))
out.append('</div>')
# adicionais
out.append('<div class="panel" id="p-adicionais" role="tabpanel" aria-labelledby="t-adicionais" hidden>')
out.append('<div class="box"><h3>Adicionais <small>Só se você quiser</small></h3>')
for n, d, p in ADIC:
    out.append(item(n, d, p, [], n.startswith('Combo')))
out.append('<p class="var">Valem para todos os polimentos e não estão inclusos nos valores acima.</p></div>')
out.append(info('Informações importantes sobre os adicionais', ADI_INFO))
out.append('</div>')
# pacotes
out.append('<div class="panel" id="p-pacotes" role="tabpanel" aria-labelledby="t-pacotes" hidden><div class="packs">')
for n, hot, its in PACOTES:
    soma = round(sum(p for _, p in its), 2); final = round(soma * 0.9, 2); eco = round(soma - final, 2)
    rows = ''.join(f'<li><span>{e(a)}</span><span>{brl(p)}</span></li>' for a, p in its)
    out.append(f'<div class="pack{" hot" if hot else ""}"><h3>{e(n)}</h3><ul>{rows}</ul>'
               f'<p class="pack-sum">Soma dos serviços <s>{brl(soma)}</s></p><p class="pack-final">{brl(final)}</p>'
               f'<p class="pack-eco">Você economiza {brl(eco)} (10%)</p>{ag(n)}</div>')
out.append('</div><p class="var">Os valores seguem as variações de cada serviço (tamanho do veículo, verniz e estado do carro) e são confirmados no orçamento. O desconto de 10% vale sobre a soma.</p></div>')

# opções do formulário
opts = ['Lavagem detalhada'] + [n for n, *_ in POLIMENTO] + ['Vitrificação: ' + n for n, *_ in VITRI] + \
       ['Manutenção de vitrificação: simples', 'Manutenção de vitrificação: completa'] + [n for n, *_ in HIGI] + \
       [n for n, *_ in PACOTES] + ['Limpeza de motor'] + \
       [f'Faróis ({"amarelamento leve" if k == "leve" else "craquelados"}): {n.replace("Restauração com ", "")}' for _, k, o in FAROIS for n, _ in o]
sel = '<option value="">Selecione</option>' + ''.join(f'<option>{e(o)}</option>' for o in opts)
adi = '<option>Nenhum</option>' + ''.join(f'<option>{e(n)}</option>' for n, *_ in ADIC)

idx = pathlib.Path(__file__).resolve().parent.parent / 'index.html'
t = idx.read_text(encoding='utf-8')
t = re.sub(r'<!--CAT-->.*?<!--/CAT-->', lambda m: '<!--CAT-->' + '\n'.join(out) + '<!--/CAT-->', t, flags=re.S)
t = re.sub(r'<!--SEL-->.*?<!--/SEL-->', lambda m: '<!--SEL-->' + sel + '<!--/SEL-->', t, flags=re.S)
t = re.sub(r'<!--ADI-->.*?<!--/ADI-->', lambda m: '<!--ADI-->' + adi + '<!--/ADI-->', t, flags=re.S)
idx.write_text(t, encoding='utf-8')
print('ok', len(out), 'blocos,', len(opts), 'serviços no formulário')
