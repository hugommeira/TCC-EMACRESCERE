import type { Metadata } from "next";
import { LegalLayout } from "@/components/landing/LegalLayout";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Política de Privacidade da Emacrescere em conformidade com a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <LegalLayout
      title="Política de Privacidade"
      subtitle="Como coletamos, usamos e protegemos seus dados pessoais e de saúde, em conformidade com a LGPD."
      updated="04 de maio de 2026"
    >
      <h2>1. Compromisso com a sua privacidade</h2>
      <p>
        A Emacrescere respeita sua privacidade e segue rigorosamente a{" "}
        <strong>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>{" "}
        e demais normas aplicáveis (CFM, ANVISA, Marco Civil da Internet).
      </p>

      <h2>2. Quais dados coletamos</h2>
      <h3>Dados cadastrais</h3>
      <ul>
        <li>Nome completo, CPF, e-mail, telefone</li>
        <li>Data de nascimento e gênero (se informado)</li>
        <li>Endereço (quando necessário para entregas pela farmácia)</li>
      </ul>
      <h3>Dados de saúde (sensíveis)</h3>
      <ul>
        <li>Histórico clínico, peso, altura, IMC e comorbidades</li>
        <li>Anamnese, exames e prontuário médico digital</li>
        <li>Prescrições emitidas e assinadas digitalmente pelo médico na plataforma</li>
      </ul>
      <h3>Dados técnicos</h3>
      <ul>
        <li>Endereço IP, dispositivo, navegador e sistema operacional</li>
        <li>Cookies estritamente necessários e de analytics anonimizados</li>
      </ul>

      <h2>3. Por que tratamos seus dados (bases legais)</h2>
      <ul>
        <li><strong>Execução de contrato:</strong> permitir consultas, agendamentos e prontuário.</li>
        <li><strong>Tutela da saúde:</strong> compartilhar dados clínicos com o médico responsável.</li>
        <li><strong>Cumprimento de obrigação legal:</strong> guarda de prontuário pelo prazo exigido pelo CFM.</li>
        <li><strong>Consentimento:</strong> envio de comunicações e marketing (sempre opt-in).</li>
      </ul>

      <h2>4. Com quem compartilhamos</h2>
      <ul>
        <li><strong>Médicos:</strong> apenas o profissional responsável pelo seu atendimento acessa seu prontuário.</li>
        <li><strong>Farmácias parceiras:</strong> somente quando você decide adquirir um medicamento prescrito.</li>
        <li><strong>Provedores de pagamento:</strong> processadores certificados (não armazenamos dados de cartão).</li>
        <li><strong>Autoridades:</strong> quando exigido por lei ou ordem judicial.</li>
      </ul>
      <p>
        Não vendemos seus dados. Não compartilhamos dados de saúde para fins
        comerciais.
      </p>

      <h2>5. Como protegemos seus dados</h2>
      <ul>
        <li>Criptografia em trânsito (TLS 1.3) e em repouso (AES-256).</li>
        <li>Acesso restrito por papel — apenas pessoal autorizado e auditado.</li>
        <li>Backups regulares e plano de continuidade.</li>
        <li>Monitoramento contínuo e plano de resposta a incidentes.</li>
      </ul>

      <h2>6. Seus direitos (LGPD)</h2>
      <p>Você pode, a qualquer momento:</p>
      <ul>
        <li>Confirmar a existência de tratamento dos seus dados</li>
        <li>Solicitar acesso, correção ou portabilidade</li>
        <li>Pedir anonimização ou eliminação de dados desnecessários</li>
        <li>Revogar consentimento (quando aplicável)</li>
        <li>Reclamar à Autoridade Nacional de Proteção de Dados (ANPD)</li>
      </ul>
      <p>
        Para exercer seus direitos, escreva para{" "}
        <a href="mailto:dpo@emacrescere.com.br">dpo@emacrescere.com.br</a>.
      </p>

      <h2>7. Retenção</h2>
      <p>
        Dados clínicos e prontuário são mantidos pelo prazo exigido pelo CFM
        (mínimo 20 anos). Demais dados ficam armazenados pelo tempo necessário
        ao cumprimento das finalidades descritas acima e da legislação vigente.
      </p>

      {/* Seção exigida pela Meta para o login com Facebook (URL de instruções
          de exclusão de dados: /privacidade#exclusao-de-dados). */}
      <h2 id="exclusao-de-dados">8. Login com Facebook e exclusão de dados</h2>
      <p>
        Se você entrar com o Facebook, recebemos dele apenas o seu nome, o seu
        e-mail e a foto do perfil, usados para criar e identificar a sua conta.
        Não publicamos nada no seu Facebook e não acessamos amigos nem
        publicações.
      </p>
      <p>
        Para tirar o acesso do Emacrescere à sua conta do Facebook: no Facebook,
        abra Configurações e privacidade, depois Configurações, depois Apps e
        sites, e remova o Emacrescere.
      </p>
      <p>
        Para pedir a exclusão dos seus dados, escreva para{" "}
        <a href="mailto:dpo@emacrescere.com.br?subject=Exclus%C3%A3o%20de%20dados">dpo@emacrescere.com.br</a>{" "}
        com o assunto “Exclusão de dados”, a partir do e-mail da sua conta.
        Excluímos a conta, o e-mail, a foto e os dados de cadastro, dentro dos
        prazos da LGPD. O prontuário e os registros das consultas são mantidos
        pelo prazo legal descrito na seção anterior.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Usamos cookies estritamente necessários para o funcionamento da
        plataforma (sessão, segurança) e cookies analíticos anonimizados para
        melhoria contínua. Você pode gerenciar cookies pelas configurações do
        seu navegador.
      </p>

      <h2>10. Encarregado de Dados (DPO)</h2>
      <p>
        Em conformidade com o art. 41 da LGPD, nosso DPO pode ser contatado por{" "}
        <a href="mailto:dpo@emacrescere.com.br">dpo@emacrescere.com.br</a>.
      </p>

      <h2>11. Atualizações</h2>
      <p>
        Esta política pode ser atualizada. Mudanças relevantes serão comunicadas
        com antecedência pelo e-mail cadastrado.
      </p>
    </LegalLayout>
  );
}
