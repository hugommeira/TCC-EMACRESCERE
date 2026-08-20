import type { Metadata } from "next";
import { LegalLayout } from "@/components/landing/LegalLayout";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: "Termos de Uso da plataforma Emaerescere — telessaúde para acompanhamento de obesidade.",
};

export default function TermosPage() {
  return (
    <LegalLayout
      title="Termos de Uso"
      subtitle="Estes termos regulam o uso da plataforma Emaerescere por pacientes, médicos e demais usuários."
      updated="04 de maio de 2026"
    >
      <h2>1. Quem somos</h2>
      <p>
        A <strong>Emaerescere</strong> é uma plataforma de <strong>telessaúde</strong>
        que conecta pacientes a médicos especialistas em obesidade e doenças
        metabólicas. Não comercializamos, indicamos nem dispensamos medicamentos.
        A condução clínica e qualquer eventual prescrição são decisão exclusiva do
        médico, em consulta individualizada.
      </p>

      <h2>2. Aceitação dos termos</h2>
      <p>
        Ao se cadastrar e utilizar a plataforma, você declara que leu, entendeu e
        concorda com estes Termos de Uso e com a nossa{" "}
        <a href="/privacidade">Política de Privacidade</a>.
      </p>

      <h2>3. Cadastro e elegibilidade</h2>
      <ul>
        <li>O cadastro de paciente é livre, gratuito e exige CPF e e-mail válidos.</li>
        <li>Você deve ter 18 anos ou mais (ou estar acompanhado de responsável legal).</li>
        <li>Os dados informados devem ser verdadeiros, completos e atualizados.</li>
        <li>Médicos e farmácias parceiras são cadastrados pela equipe Emaerescere após validação documental (CRM/ANVISA).</li>
      </ul>

      <h2>4. Telemedicina e responsabilidade médica</h2>
      <p>
        As consultas obedecem à Resolução CFM 2.314/2022 e demais normas do
        Conselho Federal de Medicina. O médico é o único responsável pela conduta
        clínica, indicações, diagnósticos e prescrições. Quando houver
        prescrição, ela será emitida pelo médico no Portal Oficial do CFM
        (prescricaoeletronica.cfm.org.br) e disponibilizada a você.
      </p>

      <h2>5. Aquisição de medicamentos</h2>
      <p>
        A Emaerescere <strong>não vende medicamentos</strong>. Caso o seu médico
        decida prescrever, a aquisição ocorre exclusivamente em farmácias
        autorizadas pela ANVISA, mediante apresentação da receita válida. As
        farmácias parceiras são empresas independentes, responsáveis por suas
        próprias práticas comerciais e logísticas.
      </p>

      <h2>6. Pagamentos</h2>
      <p>
        Os valores das consultas e demais serviços médicos são definidos pelo
        próprio profissional. A Emaerescere processa pagamentos em ambiente
        seguro (PIX, cartão ou boleto), por meio de provedores de pagamento
        certificados. Cancelamentos e reembolsos seguem as regras informadas no
        momento do agendamento.
      </p>

      <h2>7. Uso adequado da plataforma</h2>
      <ul>
        <li>É proibido utilizar a plataforma para finalidades ilegais ou ofensivas.</li>
        <li>É proibido compartilhar credenciais de acesso, dados de saúde ou prescrições com terceiros.</li>
        <li>É proibido tentar acessar áreas restritas, descompilar o sistema ou interferir em sua operação.</li>
      </ul>

      <h2>8. Limitação de responsabilidade</h2>
      <p>
        A Emaerescere atua como facilitadora tecnológica e não se responsabiliza
        por eventos clínicos decorrentes da prática médica, pela disponibilidade
        de medicamentos nas farmácias parceiras ou por interrupções
        eventuais do serviço por motivos técnicos, de força maior ou
        manutenção programada.
      </p>

      <h2>9. Conformidade regulatória</h2>
      <p>
        A plataforma respeita as normas da <strong>ANVISA</strong> (incluindo a
        RDC 96/2008 sobre publicidade de medicamentos), do <strong>CFM</strong> e
        a <strong>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>.
      </p>

      <h2>10. Alterações destes termos</h2>
      <p>
        Estes termos podem ser atualizados periodicamente. Alterações
        significativas serão comunicadas com antecedência por e-mail ou pela
        própria plataforma.
      </p>

      <h2>11. Contato</h2>
      <p>
        Em caso de dúvidas, escreva para{" "}
        <a href="mailto:contato@emaerescere.com.br">contato@emaerescere.com.br</a>.
      </p>
    </LegalLayout>
  );
}
