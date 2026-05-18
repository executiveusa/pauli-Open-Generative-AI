'use client';

import { useState } from 'react';

const LABELS = {
  en: {
    section1: 'Identity & Basics',
    section2: 'Appearance',
    section3: 'Wardrobe',
    section4: 'Personality & Voice',
    section5: 'Speech Register',
    section6: 'References',
    section7: 'Continuity',
    section8: 'Rights & Consent',
    section9: 'Safety',
    publicName: 'Public Name',
    locale: 'Character Locale',
    archetype: 'Archetype',
    ageBand: 'Age Band',
    bodyType: 'Body Type',
    facialDescription: 'Facial Features',
    hairDescription: 'Hair Description',
    skinTone: 'Skin Tone',
    wardrobeCore: 'Core Wardrobe',
    accessories: 'Accessories',
    personalityTraits: 'Personality Traits',
    speechRegister: 'Speech Register',
    dialectAccent: 'Dialect/Accent',
    backstory: 'Backstory',
    referenceAssets: 'Reference Assets',
    continuityFace: 'Lock Face',
    continuityHair: 'Lock Hair',
    continuityWardrobe: 'Lock Wardrobe',
    continuityBodyType: 'Lock Body Type',
    commercialUse: 'Commercial Use Allowed',
    likenessTraining: 'Likeness Training Allowed',
    voiceCloning: 'Voice Cloning Allowed',
    isMinor: 'Is Minor',
    isPolitical: 'Is Political Figure',
    safetyFlags: 'Safety Flags',
    submit: 'Create Character',
    cancel: 'Cancel',
  },
  es: {
    section1: 'Identidad y Datos Básicos',
    section2: 'Apariencia',
    section3: 'Vestuario',
    section4: 'Personalidad y Voz',
    section5: 'Registro de Habla',
    section6: 'Referencias',
    section7: 'Continuidad',
    section8: 'Derechos y Consentimiento',
    section9: 'Seguridad',
    publicName: 'Nombre Público',
    locale: 'Idioma del Personaje',
    archetype: 'Arquetipo',
    ageBand: 'Rango de Edad',
    bodyType: 'Tipo de Cuerpo',
    facialDescription: 'Características Faciales',
    hairDescription: 'Descripción del Cabello',
    skinTone: 'Tono de Piel',
    wardrobeCore: 'Vestuario Principal',
    accessories: 'Accesorios',
    personalityTraits: 'Rasgos de Personalidad',
    speechRegister: 'Registro de Habla',
    dialectAccent: 'Dialecto/Acento',
    backstory: 'Historia de Fondo',
    referenceAssets: 'Activos de Referencia',
    continuityFace: 'Bloquear Rostro',
    continuityHair: 'Bloquear Cabello',
    continuityWardrobe: 'Bloquear Vestuario',
    continuityBodyType: 'Bloquear Tipo de Cuerpo',
    commercialUse: 'Uso Comercial Permitido',
    likenessTraining: 'Entrenamiento de Semejanza Permitido',
    voiceCloning: 'Clonación de Voz Permitida',
    isMinor: 'Es Menor de Edad',
    isPolitical: 'Es Figura Política',
    safetyFlags: 'Banderas de Seguridad',
    submit: 'Crear Personaje',
    cancel: 'Cancelar',
  },
};

const ARCHETYPES = ['protagonist', 'villain', 'comic', 'mentor', 'sidekick', 'love-interest', 'antagonist', 'narrator'];
const AGE_BANDS = ['child', 'teen', 'adult', 'elder'];
const SPEECH_REGISTERS = ['formal', 'informal', 'street', 'telenovela'];
const LATAM_LOCALES = ['es-MX', 'es-CO', 'es-AR', 'es-CL', 'es-PE', 'es-US'];

/**
 * CharacterPassportForm — 9-section accordion form for character creation/editing.
 * @param {{
 *   onSubmit: (formData: object) => Promise<void>,
 *   submitting: boolean,
 *   submitLabel?: string,
 *   initialData?: object,
 *   locale?: 'en'|'es'
 * }} props
 */
export default function CharacterPassportForm({
  onSubmit,
  submitting = false,
  submitLabel = 'Create Character',
  initialData = null,
  locale = 'en',
}) {
  const t = LABELS[locale];
  const [expandedSections, setExpandedSections] = useState({
    1: true,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
  });

  const [formData, setFormData] = useState(initialData || {
    publicName: '',
    locale: 'es-MX',
    archetype: 'protagonist',
    ageBand: 'adult',
    bodyType: '',
    facialDescription: '',
    hairDescription: '',
    skinTone: '',
    wardrobeCore: '',
    accessories: '',
    backstory: '',
    personalityTraits: [],
    speechRegister: 'informal',
    dialectAccent: '',
    referenceAssets: [],
    continuityLocks: {
      face: true,
      hair: true,
      wardrobe: false,
      bodyType: true,
    },
    rights: {
      commercialUse: false,
      likenessTrainingAllowed: false,
      voiceCloningAllowed: false,
      isMinor: false,
      isPoliticalFigure: false,
    },
    safetyFlags: [],
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      const keys = name.split('.');
      if (keys.length === 2) {
        setFormData(prev => ({
          ...prev,
          [keys[0]]: {
            ...prev[keys[0]],
            [keys[1]]: checked,
          },
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayInput = (name, value) => {
    const items = value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [name]: items }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const Section = ({ number, title, children }) => {
    const isExpanded = expandedSections[number];
    return (
      <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900/30">
        <button
          type="button"
          onClick={() => toggleSection(number)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/30 transition-colors"
        >
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {isExpanded && (
          <div className="px-4 py-4 border-t border-zinc-800 space-y-4">
            {children}
          </div>
        )}
      </div>
    );
  };

  const InputField = ({ label, name, type = 'text', placeholder = '', ...props }) => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        {...props}
      />
    </div>
  );

  const SelectField = ({ label, name, options }) => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-2">{label}</label>
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleInputChange}
        className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const TextAreaField = ({ label, name, placeholder = '' }) => (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-2">{label}</label>
      <textarea
        name={name}
        placeholder={placeholder}
        value={formData[name] || ''}
        onChange={handleInputChange}
        rows={4}
        className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
      />
    </div>
  );

  const CheckboxField = ({ label, name, checked }) => (
    <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={checked || false}
        onChange={handleInputChange}
        className="w-4 h-4 rounded border border-zinc-600 bg-zinc-800"
      />
      {label}
    </label>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Section 1: Identity & Basics */}
      <Section number={1} title={t.section1}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label={t.publicName} name="publicName" placeholder="Character name" />
          <SelectField label={t.locale} name="locale" options={LATAM_LOCALES} />
          <SelectField label={t.archetype} name="archetype" options={ARCHETYPES} />
          <SelectField label={t.ageBand} name="ageBand" options={AGE_BANDS} />
        </div>
        <TextAreaField label={t.backstory} name="backstory" placeholder="Character backstory" />
      </Section>

      {/* Section 2: Appearance */}
      <Section number={2} title={t.section2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label={t.bodyType} name="bodyType" placeholder="e.g., Athletic, Slender" />
          <InputField label={t.skinTone} name="skinTone" placeholder="e.g., Medium brown" />
          <TextAreaField label={t.facialDescription} name="facialDescription" />
          <TextAreaField label={t.hairDescription} name="hairDescription" />
        </div>
      </Section>

      {/* Section 3: Wardrobe */}
      <Section number={3} title={t.section3}>
        <TextAreaField label={t.wardrobeCore} name="wardrobeCore" placeholder="Core wardrobe items" />
        <TextAreaField label={t.accessories} name="accessories" placeholder="Typical accessories" />
      </Section>

      {/* Section 4: Personality & Voice */}
      <Section number={4} title={t.section4}>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">{t.personalityTraits}</label>
          <input
            type="text"
            placeholder="Comma-separated traits"
            value={formData.personalityTraits?.join(', ') || ''}
            onChange={e => handleArrayInput('personalityTraits', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </Section>

      {/* Section 5: Speech Register */}
      <Section number={5} title={t.section5}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label={t.speechRegister} name="speechRegister" options={SPEECH_REGISTERS} />
          <InputField label={t.dialectAccent} name="dialectAccent" placeholder="e.g., Mexican Spanish" />
        </div>
      </Section>

      {/* Section 6: References */}
      <Section number={6} title={t.section6}>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">{t.referenceAssets}</label>
          <input
            type="text"
            placeholder="Comma-separated reference URLs or IDs"
            value={formData.referenceAssets?.join(', ') || ''}
            onChange={e => handleArrayInput('referenceAssets', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </Section>

      {/* Section 7: Continuity */}
      <Section number={7} title={t.section7}>
        <div className="space-y-3">
          <CheckboxField
            label={t.continuityFace}
            name="continuityLocks.face"
            checked={formData.continuityLocks?.face}
          />
          <CheckboxField
            label={t.continuityHair}
            name="continuityLocks.hair"
            checked={formData.continuityLocks?.hair}
          />
          <CheckboxField
            label={t.continuityWardrobe}
            name="continuityLocks.wardrobe"
            checked={formData.continuityLocks?.wardrobe}
          />
          <CheckboxField
            label={t.continuityBodyType}
            name="continuityLocks.bodyType"
            checked={formData.continuityLocks?.bodyType}
          />
        </div>
      </Section>

      {/* Section 8: Rights & Consent */}
      <Section number={8} title={t.section8}>
        <div className="space-y-3">
          <CheckboxField
            label={t.commercialUse}
            name="rights.commercialUse"
            checked={formData.rights?.commercialUse}
          />
          <CheckboxField
            label={t.likenessTraining}
            name="rights.likenessTrainingAllowed"
            checked={formData.rights?.likenessTrainingAllowed}
          />
          <CheckboxField
            label={t.voiceCloning}
            name="rights.voiceCloningAllowed"
            checked={formData.rights?.voiceCloningAllowed}
          />
          <CheckboxField
            label={t.isMinor}
            name="rights.isMinor"
            checked={formData.rights?.isMinor}
          />
          <CheckboxField
            label={t.isPolitical}
            name="rights.isPoliticalFigure"
            checked={formData.rights?.isPoliticalFigure}
          />
        </div>
      </Section>

      {/* Section 9: Safety */}
      <Section number={9} title={t.section9}>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">{t.safetyFlags}</label>
          <input
            type="text"
            placeholder="Comma-separated safety flags"
            value={formData.safetyFlags?.join(', ') || ''}
            onChange={e => handleArrayInput('safetyFlags', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-100 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </Section>

      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 text-white text-sm font-medium transition-colors"
        >
          {submitting ? '…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
