/**
 * Alea Signature - Investor Personality Classification System
 * Based on "Piedras Preciosas" methodology + TARGET DISC
 */

export const PIEDRAS_PRECIOSAS = {
  ZAFIRO: {
    name: 'Zafiro',
    emoji: '💎',
    primaryMotivation: 'Diversión',
    description: 'Persona activa, sociable y orientada a la diversión. Conecta fácilmente con otros.',
    characteristics: [
      'Muy activos con alta energía',
      'No les gusta el silencio',
      'No son muy ordenados',
      'La puntualidad no es prioridad',
      'Van por una cosa y terminan comprando otra',
      'Valoran relaciones duraderas',
      'Fáciles de ser queridos',
      'Buenos vendedores'
    ],
    communicationStyle: [
      'Alegre y positivos',
      'Les gusta destacar con ropa llamativa',
      'Colores vibrantes, accesorios',
      'Historias y ejemplos visuales'
    ],
    closingStrategy: [
      'Mantenerlo sencillo, no técnico',
      'Pintar el cuadro general',
      ' Muchas historias',
      'Tono casual, no formal',
      'Crear una visión real para ellos'
    ],
    discCorrespondence: 'I', // Influencia
    riskProfile: 'moderate',
    preferredContactStyle: 'casual_meetings'
  },

  PERLA: {
    name: 'Perla',
    emoji: '🔮',
    primaryMotivation: 'Causa (ayudar a otros)',
    description: 'Persona calmada, leal y orientada a valores. Prioriza relaciones y seguridad.',
    characteristics: [
      'Calmados y serenos',
      'Les gusta antigüedades y valores sentimentales',
      'Música relajante',
      'Prefiere ambientes tranquilos',
      'Muy leales y confiables',
      'Evitan confrontación',
      'No gastan mucho pero les gusta dar',
      'Grandes oyentes'
    ],
    communicationStyle: [
      'Ropa cómoda, colores neutros',
      'Respeto por el medio ambiente',
      'No hablan muy alto, más reservados',
      'Tono de voz suave'
    ],
    closingStrategy: [
      'Decirles que les apoyas independientemente',
      'Explicar cómo les ayuda a ellos o su familia',
      'ESCUCHARLOS',
      'Apreciar el toque personal'
    ],
    discCorrespondence: 'S', // Estabilidad
    riskProfile: 'conservative',
    preferredContactStyle: 'personal_meetings'
  },

  ESMERALDA: {
    name: 'Esmeralda',
    emoji: '💚',
    primaryMotivation: 'Análisis y orden',
    description: 'Persona analítica, detallada y metódica. Necesita datos y claridad.',
    characteristics: [
      'Muy analíticos, al detalle',
      'Amen las instrucciones',
      'Muy ordenados',
      'Tienen listas de tareas',
      'Les gusta tener todo claro',
      'Puntuales (llegar tarde es falta de respeto)',
      'Conversaciones directas al grano',
      'Conservadores al vestirse',
      'Calidad sobre precio'
    ],
    communicationStyle: [
      'Datos y organización',
      'Proceso y metodología',
      'Profesionalismo',
      'Preguntas específicas'
    ],
    closingStrategy: [
      'Validar por qué funciona sin insistir',
      'Hablar de integridad',
      'Enseñar cómo ahorra dinero',
      'Si no sabes, di "muy buena pregunta, te llamo en 2 horas"'
    ],
    discCorrespondence: 'C', // Cumplimiento
    riskProfile: 'conservative',
    preferredContactStyle: 'detailed_reports'
  },

  RUBI: {
    name: 'Rubí',
    emoji: '❤️',
    primaryMotivation: 'Desafío (ganar, destacar)',
    description: 'Persona competitiva, ambiciosa y orientada a resultados. Le gusta el control.',
    characteristics: [
      'Metas ambiciosas, toman acción',
      'Competitivos, van a ganar',
      'Les gusta generar ingresos',
      'No muy organizados pero no descuidados',
      'Prefieren pagar para evitar hacer',
      'En casa siguen trabajando',
      'Prefieren deportes individuales',
      'No les gusta perder tiempo'
    ],
    communicationStyle: [
      'Quieren destacar',
      'Marcas y elegancia',
      'Colores sofisticados',
      'Profesional con toque moderno'
    ],
    closingStrategy: [
      'Proceso rápido',
      'Orientar a resultados',
      'Ser preciso, mencionar sus metas',
      'Ellos quieren ser los PRIMEROS',
      'Validar sus ideas y crear puente hacia las tuyas'
    ],
    discCorrespondence: 'D', // Dominancia
    riskProfile: 'aggressive',
    preferredContactStyle: 'efficient_brief_meetings'
  }
};

export const INVESTOR_TYPES = {
  FAMILY_OFFICE: {
    name: 'Family Office',
    description: 'Gestión patrimonial de una familia',
    typicalBudget: '5M€ - 50M€+',
    decisionTime: '2-6 meses',
    riskProfile: 'conservative',
    preferredStone: ['PERLA', 'ESMERALDA']
  },
  HNW_INDIVIDUAL: {
    name: 'High Net Worth Individual',
    description: 'Inversor individual de alto patrimonio',
    typicalBudget: '500K€ - 5M€',
    decisionTime: '1-3 meses',
    riskProfile: 'moderate',
    preferredStone: ['RUBI', 'ZAFIRO']
  },
  INSTITUTIONAL: {
    name: 'Inversionista Institucional',
    description: 'Fondos, bancos, aseguradoras',
    typicalBudget: '10M€ - 100M€+',
    decisionTime: '6-12 meses',
    riskProfile: 'conservative',
    preferredStone: ['ESMERALDA', 'PERLA']
  },
  REAL_ESTATE_FUND: {
    name: 'Fondo Inmobiliario',
    description: 'Fondo especializado en bienes raíces',
    typicalBudget: '5M€ - 50M€',
    decisionTime: '3-6 meses',
    riskProfile: 'moderate',
    preferredStone: ['ESMERALDA', 'RUBI']
  },
  REGIONAL_INVESTOR: {
    name: 'Inversor Regional',
    description: 'Inversor de una región específica',
    typicalBudget: '100K€ - 1M€',
    decisionTime: '1-2 meses',
    riskProfile: 'moderate',
    preferredStone: ['ZAFIRO', 'PERLA']
  },
  INTERNATIONAL_BUYER: {
    name: 'Comprador Internacional',
    description: 'Inversor extranjero buscando diversificación',
    typicalBudget: '500K€ - 5M€',
    decisionTime: '1-3 meses',
    riskProfile: 'moderate',
    preferredStone: ['RUBI', 'ZAFIRO']
  }
};

export interface InvestorClassification {
  piedraPrimaria: keyof typeof PIEDRAS_PRECIOSAS;
  piedraSecundaria?: keyof typeof PIEDRAS_PRECIOSAS;
  discProfile: 'D' | 'I' | 'S' | 'C';
  investorType: keyof typeof INVESTOR_TYPES;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  communicationPreference: string;
  closingStrategy: string[];
  followUpPriority: 'high' | 'medium' | 'low';
  budgetRange: { min: number; max: number };
  estimatedDecisionTime: string;
  confidence?: number;
}

export function classifyInvestor(data: {
  name?: string;
  company?: string;
  documents?: string[];
  communicationStyle?: string;
  budgetMin?: number;
  budgetMax?: number;
  source?: string;
}): InvestorClassification {
  // Default classification based on available data
  let piedraPrimaria: keyof typeof PIEDRAS_PRECIOSAS = 'ZAFIRO';
  let piedraSecundaria: keyof typeof PIEDRAS_PRECIOSAS | undefined = undefined;
  let discProfile: 'D' | 'I' | 'S' | 'C' = 'I';
  let riskProfile: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
  let investorType: keyof typeof INVESTOR_TYPES = 'HNW_INDIVIDUAL';
  let followUpPriority: 'high' | 'medium' | 'low' = 'medium';
  let budgetRange = { min: 250000, max: 1000000 };
  let confidence = 0.5;

  // Analyze budget for type (use if-else to avoid overlap)
  if (data.budgetMax) {
    if (data.budgetMax >= 5000000) {
      investorType = 'FAMILY_OFFICE';
      riskProfile = 'conservative';
      budgetRange = { min: 5000000, max: 50000000 };
      followUpPriority = 'high';
      confidence = 0.7;
    } else if (data.budgetMax >= 1000000) {
      investorType = 'HNW_INDIVIDUAL';
      riskProfile = 'moderate';
      budgetRange = { min: 1000000, max: 5000000 };
      followUpPriority = 'high';
      confidence = 0.7;
    } else if (data.budgetMax >= 100000) {
      investorType = 'REGIONAL_INVESTOR';
      budgetRange = { min: 100000, max: 1000000 };
      confidence = 0.6;
    } else {
      // < 100K - minimum ticket
      investorType = 'REGIONAL_INVESTOR';
      budgetRange = { min: 50000, max: 100000 };
      followUpPriority = 'low';
      confidence = 0.5;
    }
  }

  // If we have company name, potentially institutional
  if (data.company) {
    const companyLower = data.company.toLowerCase();
    if (companyLower.includes('fund') || companyLower.includes('capital') || 
        companyLower.includes('asset management') || companyLower.includes('family office')) {
      investorType = 'REAL_ESTATE_FUND';
      riskProfile = 'conservative';
      piedraPrimaria = 'ESMERALDA';
      discProfile = 'C';
      confidence = 0.8;
    }
  }

  // Analyze communication style for piedra
  if (data.communicationStyle) {
    const style = data.communicationStyle.toLowerCase();
    if (style.includes('rápido') || style.includes('resultado') || style.includes('ganar') || style.includes('迫不及待')) {
      piedraPrimaria = 'RUBI';
      discProfile = 'D';
    } else if (style.includes('detalle') || style.includes('claro') || style.includes('datos') || style.includes('pormenor')) {
      piedraPrimaria = 'ESMERALDA';
      discProfile = 'C';
    } else if (style.includes('ayudar') || style.includes('familia') || style.includes('tranquilo') || style.includes('relajado')) {
      piedraPrimaria = 'PERLA';
      discProfile = 'S';
    } else if (style.includes('sociable') || style.includes('amistad') || style.includes('evento') || style.includes('reunión')) {
      piedraPrimaria = 'ZAFIRO';
      discProfile = 'I';
    }
  }

  // Analyze documents for additional signals
  if (data.documents && data.documents.length > 0) {
    const docsText = data.documents.join(' ').toLowerCase();
    if (docsText.includes('fund') || docsText.includes('family office') || docsText.includes('institutional')) {
      investorType = 'INSTITUTIONAL';
      piedraPrimaria = 'ESMERALDA';
      discProfile = 'C';
      confidence = 0.85;
    }
  }

  // Determine piedra secondary based on investor type
  const investorTypeData = INVESTOR_TYPES[investorType];
  if (investorTypeData?.preferredStone) {
    const preferred = investorTypeData.preferredStone;
    if (preferred.includes(piedraPrimaria) && preferred.length > 1) {
      piedraSecundaria = preferred.find(s => s !== piedraPrimaria);
    }
  }

  const piedraInfo = PIEDRAS_PRECIOSAS[piedraPrimaria];

  return {
    piedraPrimaria,
    piedraSecundaria,
    discProfile,
    investorType,
    riskProfile,
    communicationPreference: piedraInfo.preferredContactStyle,
    closingStrategy: piedraInfo.closingStrategy,
    followUpPriority,
    budgetRange,
    estimatedDecisionTime: investorTypeData?.decisionTime || '1-3 meses',
    confidence
  } as InvestorClassification;
}

export function getClassificationPrompt(investorData: {
  name: string;
  company?: string;
  source?: string;
}): string {
  return `
Analiza al siguiente inversor y clasifica su personalidad según el sistema "Piedras Preciosas" de Alea Signature:

**Nombre:** ${investorData.name}
**Empresa:** ${investorData.company || 'No especificada'}
**Fuente:** ${investorData.source || 'No especificada'}

**Sistema de clasificación:**

1. **ZAFIRO** 💎 - Motivado por Diversión
   - Sociable, activo, competitivo
   - Comunicación: alegre, historias, tono casual
   - Cierre: simple, visión, historias

2. **PERLA** 🔮 - Motivado por Causa
   - Leales, calmados, orientados a ayudar
   - Comunicación: suave, escuchar, personal
   - Cierre: apoyar, escuchar, toque personal

3. **ESMERALDA** 💚 - Motivado por Análisis
   - Detallistas, organizados, puntuales
   - Comunicación: datos, proceso, profesional
   - Cierre: validar, integridad, ahorro

4. **RUBÍ** ❤️ - Motivado por Desafío
   - Competitivos, ambiciosos, orientados a ganar
   - Comunicación: resultados, eficiencia, precisión
   - Cierre: rápido, resultados, validar ideas

Responde en JSON:
{
  "piedraPrimaria": "ZAFIRO|PERLA|ESMERALDA|RUBI",
  "piedraSecundaria": "..." | null,
  "discProfile": "D|I|S|C",
  "confidence": 0.0-1.0,
  "keyObservations": ["..."],
  "recommendedApproach": "..."
}
`;
}

export const TARGET_DISC = {
  D: {
    name: 'Dominancia',
    color: 'red',
    traits: ['Action-oriented', 'Challenger', 'Decider', 'Risk-taker'],
    communication: ['Direct', 'Firm', 'Results-focused']
  },
  I: {
    name: 'Influencia',
    color: 'yellow',
    traits: ['People-oriented', 'Persuader', 'Enthusiast', 'Optimist'],
    communication: ['Friendly', 'Persuasive', 'Storytelling']
  },
  S: {
    name: 'Estabilidad',
    color: 'green',
    traits: ['Methodical', 'Team-builder', 'Patient', 'Loyal'],
    communication: ['Calm', 'Patient', 'Supportive']
  },
  C: {
    name: 'Cumplimiento',
    color: 'blue',
    traits: ['Detail-oriented', 'Quality-focused', 'Planner', 'Analyzer'],
    communication: ['Precise', 'Data-driven', 'Thorough']
  }
};