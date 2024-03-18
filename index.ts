import axios, { type AxiosProgressEvent } from "axios";
import { JSDOM } from 'jsdom'
import path from 'path'
import cliProgress from 'cli-progress'

const multibar = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: ' {bar} | {filename} | {value}/{total}',
}, cliProgress.Presets.shades_grey)

const onDownloadProgress = (progressBar: cliProgress.SingleBar, filename: string) => (progressEvent: AxiosProgressEvent) => {
    if (progressEvent.total) {
        var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        progressBar.update(percentCompleted, { filename })
    }
}

async function downloadReceitaNet(url: string)
{
    const { data } = await axios.get(url)
    
    const dom = new JSDOM(data)
    const elements = dom.window.document.querySelectorAll('a.external-link')
    const downloadUrl = Array.from(elements).map((e: any) => e.href).find(e => e.includes('.exe'))
    const name = path.basename(downloadUrl)
    const progress = multibar.create(100, 0)

    const response = await axios.get(downloadUrl, {
        onDownloadProgress: onDownloadProgress(progress, name)
    })

    await Bun.write('./' + name, response.data)
}
async function downloadOffice365()
{
    const path = 'officesetup.exe'
    const progress = multibar.create(100, 0)
    const url = 'https://c2rsetup.officeapps.live.com/c2r/download.aspx?productReleaseID=O365ProPlusRetail&platform=Def&language=pt-br'
    const { data } = await axios.get(url, {
        onDownloadProgress: onDownloadProgress(progress, path)
    })

    await Bun.write('./' + path, data)
}

const urlsReceitaNet = [
    'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/receitanet/download-do-programa-receitanet',
    'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/receitanetbx/download-do-programa-receitanetbx-windows',
    'https://www.gov.br/receitafederal/pt-br/centrais-de-conteudo/download/receitanetbx/download-do-programa-receitanetbx-servico',
    'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/sped-sistema-publico-de-escrituracao-digital/escrituracao-contabil-digital-ecd/escrituracao-contabil-digital-ecd',
    'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/sped-sistema-publico-de-escrituracao-digital/escrituracao-contabil-fiscal-ecf/sped-programa-sped-contabil-fiscal',
    'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/sped-sistema-publico-de-escrituracao-digital/escrituracao-fiscal-digital-efd/escrituracao-fiscal-digital-efd',
    'https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/sped-sistema-publico-de-escrituracao-digital/efd-contribuicoes/programa-validador-da-escrituracao-fiscal-digital-das-contribuicoes-incidentes-sobre-a-receita-efd-contribuicoes-2'
]

await Promise.all([...urlsReceitaNet.map(downloadReceitaNet), downloadOffice365()])

multibar.stop()