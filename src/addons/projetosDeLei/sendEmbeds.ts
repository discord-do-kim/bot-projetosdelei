import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Colors,
  EmbedBuilder,
} from "discord.js";

import { config } from "./config";

export async function sendEmbeds(client: Client): Promise<void> {
  const channel = await client.channels.fetch(config.send_channel);

  if (channel === null) {
    throw new Error("Não encontrei o canal para enviar os embeds.");
  }

  if (!channel.isTextBased()) throw new Error("Channel is not text based");

  if (!channel.isDMBased()) await channel.bulkDelete(20);

  await channel.send({
    embeds: [rejeitadasEmbed, repetidasEmbed, dicasEmbed],
  });

  await channel.send({
    content: "https://m.youtube.com/watch?v=M4DUxVJF-lQ&feature=youtu.be",
  });

  const sendProjectButton = new ButtonBuilder({
    label: "Enviar sugestão de projeto de lei!",
    customId: config.customIds.suggestNewProject,
    style: ButtonStyle.Secondary,
  });

  const buttons = new ActionRowBuilder<ButtonBuilder>({
    components: [sendProjectButton],
  });

  await channel.send({
    embeds: [faqEmbed],
    components: [buttons],
  });
}

const projetosData = {
  rejeitados: `
Obviamente, não podemos acatar todas as sugestões, mas eis os motivos mais comuns para a rejeição:
ㅤ
ㅤ
**1. Inconstitucionalidade.**
Se o seu PL for contrário à Constituição, não podemos propô-lo. Eventualmente, podemos propor uma PEC para mudar a Constituição, mas isso requer muito mais apoio político;

**2. Ele contraria tratados internacionais.**
ㅤ
**3. Ele gera desbalanço orçamentário (gera despesa ou renúncia de receita), contrariando a Constituição e a Lei de Responsabilidade Fiscal.**
ㅤ
**4. Ele contraria as políticas econômicas do Mercosul (geralmente, isso diz respeito às importações).**
ㅤ
**5. Ele é megalomaníaco (mudar toda a Constituição, etc…).**
ㅤ
**6. Ele não tem condições de ter apoio político dos demais parlamentares.**
ㅤ
**7. Ele é de competência dos Estados e Municípios.**
ㅤ
**8. Ele tem iniciativa reservada a outro Poder.**
ㅤ
**9. Requer uma discussão política mais ampla, e não tão pontual (Um bom exemplo é o porte de armas para casos específicos… Precisamos repensar toda a estrutura da leido desarmamento).**
ㅤ
**10. Já há projeto semelhante em tramitação.**
`,
  recorrentes: `Segue uma lista de sugestões recorrentes. A lista está sempre em expansão.
ㅤ
ㅤ
**1. Podemos baixar os impostos de importação ou criar isenção para o produto X ou Y?**
■ Não.
■ Esbarra nas políticas do Mercosul.
■ Ele cria um rombo orçamentário.
■ Quando um PL cria despesa, é preciso mostrar de onde virá o dinheiro do rombo(art. 113 do ADCT). No momento, pelo fato do orçamento estar no limite, não temos como fazer isso.
ㅤ
**2. Podemos ter CNH com 17, 16, 15, 14, 10, 5, 3 anos de idade?**
■ Podemos, mas é algo quase impossível de ser aprovado.
■ Não convém ter motoristas com menos de 18 anos porque eles seriam penalmente inimputáveis, já que a responsabilidade penal se dá com 18 anos(e isso está na Constituição).
■ Ademais, as cidades simplesmente não aguentam mais tantos carros.

Enfim, sei que tem pessoas com 16 ou 15 anos que seriam motoristas bem melhores do que os que estão nas ruas, mas não convém fazer esse PL.
ㅤ
**3. Podemos aumentar o efetivo das Forças Armadas?**
■ Não. Isso é de iniciativa do presidente da República.
ㅤ
**4. Podemos vincular o salário dos políticos e juízes ao salário mínimo?**
■ Seria muito difícil. Depende de PEC e criaria desarranjos orçamentários.
ㅤ
**5. Podemos impor requisitos mínimos para uma pessoa votar, como escolaridade, testede aptidão, etc? E para ser votado?**
■ Não.
■ Isso contraria tratados internacionais de direitos humanos.
■ É inconstitucional.
ㅤ
Sei que é irritante ver pessoas desqualificadas votando e sendo votadas, mas restringir o sufrágio é não só um erro, mas atenta contra vários tratados internacionais.
ㅤ
**6. Vocês podem mudar uma resolução do contran, do detran, etc?**
■ Não. Podemos propor um PDL para declará-la ilegal ou fazer uma lei que torne tal resolução ilegal, mas fora isso, não.
ㅤ
**7. Podemos diminuir o número de políticos?**
■ Podemos, mas já há projetos nesse sentido.
ㅤ
**8. Podemos cobrar mensalidade em universidades públicas?**
■ Já há projeto nesse sentido
ㅤ
**9. O voto pode ser facultativo?**
■ Pode, mas já há PEC nesse sentido.
ㅤ
**10. Vocês podem criar órgãos por PL?**
■ Não, isso é de iniciativa do Executivo.
ㅤ
**11. Podemos privatizar por PL?**
■ Mais ou menos.
■ Há uma lei de privatização de 1997 que dá ao governo o poder de privatizar tudo, menos as empresas que ela cita.
■ O STF entendeu que a lei é constitucional. O Kim já propôs PL para incluir o Banco do Brasil no rol de privatizáveis (o BB está na lista de exceções da lei).

Se as privatizações estão paradas, certamente não é culpa do Congresso.
ㅤ
**12. Pode fazer um PL para que eu saque o FGTS ou escolha onde ele será aplicado?**
■ Já temos PLs sobre isso e há outros tramitando
ㅤ
**13. Podemos fazer PL permitindo venda de sangue e órgãos?**
■ Não, é inconstitucional.`,
  tip: `
**1. O fórum é somente para sugestões de projetos. Outras questões políticas devem ser destinadas ao fórum próprio;**

**2. Por favor, veja se sua sugestão não se enquadra numa das sugestões recorrentes;**

**3. Se a sua sugestão for boa, vamos transformá-la em projeto. Já fizemos isso antes;**

**4. Eu (Luiz Felipe Panelli, assessor do Kim) tentarei entrar no Discord diariamente**`,
  avatarPanelli:
    "https://cdn.discordapp.com/avatars/740977650423824554/a0efafbb5e4d1b85db5415a481e535f8.webp?size=2048",
  customResponses: [],
};

const rejeitadasEmbed = new EmbedBuilder({
  title: "POR QUE MINHA SUGESTÃO FOI REJEITADA?",
  description: projetosData.rejeitados,
  color: Colors.Red,
  footer: {
    text: "lfpanelli",
    iconURL: projetosData.avatarPanelli,
  },
});

const repetidasEmbed = new EmbedBuilder({
  title: "SUGESTÕES RECORRENTES.",
  description: projetosData.recorrentes,
  color: Colors.Yellow,
  footer: {
    text: "lfpanelli",
    iconURL: projetosData.avatarPanelli,
  },
});

const dicasEmbed = new EmbedBuilder({
  title: "BEM-VINDO AO DISCORD DE SUGESTÕES LEGISLATIVAS.",
  description: projetosData.tip,
  color: Colors.Blue,
});

const faqEmbed = new EmbedBuilder({
  title: "FAQ SOBRE OS PROJETOS DE LEI",
  description:
    "Leia os cards acima antes de mandar o seu PL, para que ele não seja rejeitado ou removido. :)",
  fields: [
    {
      name: "1 - Primeiro precisamos que o seu PL esteja de acordo com o tutorial e avisos acima.",
      value:
        "Seu projeto será rejeitado se ele bater em alguns dos pontos citados acima.\n",
    },
    {
      name: "2 - O botão abaixo abrirá uma caixa de formulário que enviará o seu PL para moderação do servidor.",
      value:
        "Essa fiscalização é apenas para filtrar **FLOOD**, **SPAM**, **PROJETOS REPETIDOS**, e projetos que batem nos motivos de rejeição acima.\n",
    },
    {
      name: "3 - Você receberá um aviso no seu privado se o seu PL passar na fiscalização.",
      value:
        "Se você tiver o privado fechado, e o seu PL for rejeitado, você não vai saber o motivo. Procure o #suporte para mais informações.\n",
    },
    {
      name: "4 - Se o seu projeto for aceito na fiscalização, uma thread será aberta aqui mesmo nesse canal.",
      value:
        "Você é livre para mandar contexto adicional sobre o seu PL, mas não deve marcar o @lfpanelli.\n",
    },
  ],
  color: Colors.DarkButNotBlack,
});
