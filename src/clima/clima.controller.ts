import { Controller, Post, Body, Res } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Response } from 'express';
import { PrevisaoResponse } from './clima.intefaces';
import { HttpService } from '@nestjs/axios';
import { BRASIL_STATES_GEOCODES } from 'src/common/constants';

function agruparPrevisoesPorGeocodeETurno(previsoes) {
  const resultado = {};

  for (const previsao of previsoes) {
    const estadoGeocode = previsao.geocode.toString().substring(0, 2);
    const municipioGeocode = previsao.geocode.toString();

    if (!resultado[estadoGeocode]) {
      resultado[estadoGeocode] = {};
    }

    if (!resultado[estadoGeocode][municipioGeocode]) {
      resultado[estadoGeocode][municipioGeocode] = {};
    }

    if (!BRASIL_STATES_GEOCODES[estadoGeocode]) {
      console.log('ESTADO GEOCODE', estadoGeocode);
      console.log(
        'BRASIL_STATES_GEOCODES',
        BRASIL_STATES_GEOCODES[estadoGeocode],
      );
    }

    resultado[estadoGeocode][municipioGeocode][previsao.turno] = {
      nome: previsao.nome,
      capital: previsao.capital,
      cor: previsao.cor,
      centroide: previsao.centroide,
      resumo: previsao.resumo,
      data_previsao: previsao.data_previsao,
      temperatura_maxima: previsao.temperatura_maxima,
      temperatura_minima: previsao.temperatura_minima,
      icone: previsao.icone,
      turno: previsao.turno,
    };
  }

  return resultado;
}

function calcularTemperaturasPorEstado(dados) {
  if (!dados) {
    console.error('Dados não estão disponíveis.');
    return {};
  }

  const resultado = {};

  for (const estado in dados) {
    let minima = Number.POSITIVE_INFINITY;
    let maxima = Number.NEGATIVE_INFINITY;
    const minimaCidades = new Set<string>();
    const maximaCidades = new Set<string>();

    const municipios = dados[estado];
    for (const codigoMunicipio in municipios) {
      const turnos = municipios[codigoMunicipio];
      for (const turnoKey in turnos) {
        const previsao = turnos[turnoKey];
        const { nome, temperatura_minima, temperatura_maxima } = previsao;

        if (temperatura_minima < minima) {
          minima = temperatura_minima;
          minimaCidades.clear();
          minimaCidades.add(nome);
        } else if (temperatura_minima === minima) {
          minimaCidades.add(nome);
        }

        if (temperatura_maxima > maxima) {
          maxima = temperatura_maxima;
          maximaCidades.clear();
          maximaCidades.add(nome);
        } else if (temperatura_maxima === maxima) {
          maximaCidades.add(nome);
        }
      }
    }

    resultado[estado] = {
      minTemp: minima,
      maxTemp: maxima,
      minima: Array.from(minimaCidades),
      maxima: Array.from(maximaCidades),
    };
  }

  return resultado;
}

@Controller('tempo')
export class TempoController {
  constructor(private httpService: HttpService) {}

  @Post()
  getPrevisao(@Body() body: any, @Res() res: Response): void {
    const headers = {
      Accept: '*/*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      Connection: 'keep-alive',
      'Content-Type': 'application/json',
      Origin: 'https://portal.inmet.gov.br',
      Referer: 'https://portal.inmet.gov.br/',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-site',
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'sec-ch-ua':
        '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Linux"',
    };

    this.httpService
      .post<PrevisaoResponse[]>(
        'https://apiprevmet3.inmet.gov.br/Previsao_Portal',
        body,
        { headers },
      )
      .pipe(
        map((response) => {
          const normalize = response.data.map(({ poligono, ...rest }) => rest);
          const previsao = agruparPrevisoesPorGeocodeETurno(normalize);
          return {
            previsao,
            minMax: calcularTemperaturasPorEstado(previsao),
          };
        }),
      )
      .subscribe({
        next: (data) => res.json(data),
        error: (err) => res.status(500).send(err.message),
      });
  }
}
