import type { LegalTexts } from "./types";

export const legalPt: LegalTexts = {
  addressLine: "Morada: {address}.",

  privacy: {
    title: "Política de privacidade",
    intro:
      "Crowns é um jogo de lógica. Esta página explica que dados tratamos, para quê e o que podes fazer com eles. Última atualização: {date}.",
    sections: [
      {
        heading: "Quem é o responsável",
        body: [
          "O responsável pelo tratamento é {company}, com o número fiscal {taxId}, titular do serviço publicado em {site}.",
          "Para qualquer assunto relacionado com os teus dados: {email}.",
        ],
      },
      {
        heading: "Que dados tratamos",
        body: ["Depende de como jogas."],
        list: [
          "Se jogas sem conta: nenhuns. Os jogos e as preferências ficam no teu navegador e não chegam aos nossos servidores.",
          "Se crias uma conta: o teu endereço de email. Se entrares com Google ou GitHub, recebemos deles o email e o nome público associado.",
          "Perfil: nome de jogador, nome visível (se o definires) e idioma escolhido.",
          "Jogos: tamanho do tabuleiro, tempo, dicas usadas, número de jogadas, data e o tabuleiro resolvido.",
          "Dados técnicos: os nossos fornecedores registam o endereço IP e dados de ligação para o serviço funcionar e se proteger de abusos.",
        ],
      },
      {
        heading: "Para quê e com que base legal",
        body: [
          "Os dados da conta e do perfil servem para entrares, guardares o teu histórico e apareceres nos rankings: é a execução do serviço que pedes ao registares-te.",
          "Os dados técnicos e de segurança são tratados com base no interesse legítimo em manter o serviço disponível e livre de abusos.",
          "Não fazemos publicidade, não criamos perfis comerciais e não vendemos nem cedemos dados a terceiros.",
        ],
      },
      {
        heading: "O que é público",
        body: [
          "O jogo tem rankings e um mural de atividade. Ao resolveres um puzzle publicamos o teu nome de jogador, o nome visível se o tiveres definido, o tempo, as dicas usadas, a data e o tabuleiro jogado.",
          "O teu email nunca é público nem é mostrado a outros jogadores. Se preferires não ser reconhecido, escolhe um nome de jogador que não te identifique.",
        ],
      },
      {
        heading: "O que guardamos no teu navegador",
        body: [
          "Não usamos cookies de rastreio nem ferramentas de analítica. No armazenamento local do navegador guardamos: a sessão iniciada, o idioma, o tema claro ou escuro, os teus melhores tempos e, se jogares sem conta, o teu histórico de jogos.",
          "Podes apagá-lo quando quiseres nas definições do navegador.",
        ],
      },
      {
        heading: "Quem nos ajuda a prestar o serviço",
        body: ["Trabalhamos com fornecedores que tratam dados por nossa conta:"],
        list: [
          "Supabase: base de dados e sistema de contas. Os dados ficam em servidores de Londres (Reino Unido), país com decisão de adequação da Comissão Europeia.",
          "GitHub Pages: alojamento do site.",
          "Google ou GitHub: apenas se escolheres entrar com eles, e só para verificar a tua identidade.",
        ],
      },
      {
        heading: "Durante quanto tempo",
        body: [
          "Enquanto mantiveres a conta aberta. Se a apagares, eliminamos o teu perfil e os teus jogos. Os registos técnicos dos fornecedores são conservados pelos prazos que eles aplicam por segurança.",
        ],
      },
      {
        heading: "Os teus direitos",
        body: [
          "Podes pedir-nos acesso aos teus dados, retificá-los, apagá-los, limitar ou opor-te ao tratamento e pedir a portabilidade. Escreve para {email} e responderemos dentro do prazo legal.",
          "Se achares que o teu pedido não foi bem atendido, podes reclamar junto da autoridade de proteção de dados do teu país (em Portugal, a CNPD).",
        ],
      },
      {
        heading: "Menores",
        body: [
          "O serviço não se dirige a menores de 14 anos. Se detetarmos uma conta de um menor dessa idade sem autorização de quem exerce a tutela, será eliminada.",
        ],
      },
      {
        heading: "Alterações",
        body: [
          "Se esta política mudar, atualizamos a data no cabeçalho e, se a mudança for relevante, avisamos dentro do jogo.",
        ],
      },
    ],
  },

  terms: {
    title: "Condições do serviço",
    intro:
      "Estas condições regulam o uso de Crowns, disponível em {site}. Ao usares o jogo aceitas estas condições. Última atualização: {date}.",
    sections: [
      {
        heading: "O que é o Crowns",
        body: [
          "Crowns é um jogo de lógica gratuito operado por {company} (número fiscal {taxId}). Podes jogar sem conta; criar uma serve para guardar o histórico e participar nos rankings.",
        ],
      },
      {
        heading: "A tua conta",
        body: [
          "Precisas de um endereço de email válido e és responsável por manter as tuas credenciais seguras. Avisa-nos em {email} se suspeitares que alguém as está a usar.",
          "Escolhe um nome de jogador respeitoso. Podemos alterar ou retirar nomes ofensivos, ou que se façam passar por outra pessoa ou marca.",
        ],
      },
      {
        heading: "Uso aceitável",
        body: ["Ao usares o jogo comprometes-te a não:"],
        list: [
          "Automatizar jogos com programas ou scripts para falsear tempos ou posições nos rankings.",
          "Tentar aceder a dados de outras contas nem contornar as restrições do serviço.",
          "Sobrecarregar o serviço ou extrair dados em massa.",
          "Usar o nome de jogador ou o nome visível para publicar conteúdo ofensivo, ilegal ou publicitário.",
        ],
      },
      {
        heading: "Resultados e rankings",
        body: [
          "Ao resolveres um puzzle, o teu resultado e o teu nome de jogador são publicados na atividade e nas classificações.",
          "Podemos retirar resultados manifestamente falsos ou obtidos em violação destas condições, e suspender as contas envolvidas.",
        ],
      },
      {
        heading: "Disponibilidade",
        body: [
          "O serviço é oferecido tal como está e de forma gratuita, sem garantia de disponibilidade contínua. Pode mudar, ser interrompido ou encerrado. Guarda cópia do que te importa: não garantimos a recuperação de jogos.",
        ],
      },
      {
        heading: "Responsabilidade",
        body: [
          "Na medida em que a lei o permita, {company} não responde por danos indiretos decorrentes do uso ou da impossibilidade de usar o jogo. Nada disto limita os direitos que a lei do consumidor te reconhece.",
        ],
      },
      {
        heading: "Propriedade",
        body: [
          "O nome, o design e o conteúdo do jogo pertencem a {company}. O código-fonte está publicado no GitHub e rege-se pela licença aí indicada.",
        ],
      },
      {
        heading: "Cancelamento",
        body: [
          "Podes deixar de usar o jogo quando quiseres. Para eliminar a tua conta e os teus dados, escreve para {email}.",
        ],
      },
      {
        heading: "Lei aplicável",
        body: [
          "Estas condições regem-se pela legislação espanhola. Se agires como consumidor, podes recorrer aos tribunais da tua residência.",
        ],
      },
      {
        heading: "Alterações",
        body: [
          "Podemos atualizar estas condições. A data do cabeçalho indica a última versão e as alterações relevantes serão avisadas no jogo.",
        ],
      },
    ],
  },
};
