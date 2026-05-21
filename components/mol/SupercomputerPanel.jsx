'use client';

/**
 * SupercomputerPanel — full Supercomputer routing UI panel.
 * Props:
 *   onModelSelect(model)  — called when user clicks a model card
 *   onModeChange(mode)    — called when routing mode changes
 *   initialMode           — default routing mode id (default: 'auto-best')
 *   locale                — 'en' | 'es'
 *   availableProviders    — array of provider id strings that have keys configured
 */

import { useState, useMemo } from 'react';
import { MODEL_REGISTRY, ROUTING_MODES, getCapabilityBadges } from '@/packages/shared/src/model-routing/supercomputer.js';
import ModelRoutingBadge from './ModelRoutingBadge.jsx';

// ─── Provider color mapping ──────────────────────────────────────────────────────
const PROVIDER_COLORS = {
  mock:        'text-zinc-400 bg-zinc-800',
  openai:      'text-emerald-300 bg-emerald-950',
  google:      'text-blue-300 bg-blue-950',
  runway:      'text-violet-300 bg-violet-950',
  kling:       'text-pink-300 bg-pink-950',
  seedance:    'text-amber-300 bg-amber-950',
  wan:         'text-cyan-300 bg-cyan-950',
  muapi:       'text-orange-300 bg-orange-950',
  fal:         'text-indigo-300 bg-indigo-950',
  huggingface: 'text-yellow-300 bg-yellow-950',
  local:       'text-green-300 bg-green-950',
  stub:        'text-zinc-400 bg-zinc-900',
};

// ─── Cost tier dots ──────────────────────────────────────────────────────────────
const COST_DOT = {
  free:   'bg-green-500',
  low:    'bg-yellow-400',
  medium: 'bg-orange-400',
  high:   'bg-red-500',
};

const COST_LABEL = {
  free:   { en: 'Free',   es: 'Gratis' },
  low:    { en: 'Low',    es: 'Bajo' },
  medium: { en: 'Medium', es: 'Medio' },
  high:   { en: 'High',   es: 'Alto' },
};

// ─── Speed icons ─────────────────────────────────────────────────────────────────
const SPEED_ICON = {
  instant: '⚡',
  fast:    '🚀',
  normal:  '⏱️',
  slow:    '🐢',
};

// ─── Quality badge colors ─────────────────────────────────────────────────────────
const QUALITY_STYLE = {
  draft:    'bg-zinc-700 text-zinc-300',
  standard: 'bg-blue-900 text-blue-200',
  premium:  'bg-violet-900 text-violet-200',
};

// ─── Strings ──────────────────────────────────────────────────────────────────────
const STRINGS = {
  en: {
    title:       'Supercomputer',
    routingMode: 'Routing Mode',
    models:      'Available Models',
    missingKey:  'Missing Key',
    selectModel: 'Click to select',
    selected:    'Selected',
    noKey:       'No key',
    cost:        'Cost',
    speed:       'Speed',
    quality:     'Quality',
    compare:     'Compare mode — select up to 4 models',
  },
  es: {
    title:       'Supercomputadora',
    routingMode: 'Modo de Enrutamiento',
    models:      'Modelos Disponibles',
    missingKey:  'Clave Faltante',
    selectModel: 'Clic para seleccionar',
    selected:    'Seleccionado',
    noKey:       'Sin clave',
    cost:        'Costo',
    speed:       'Velocidad',
    quality:     'Calidad',
    compare:     'Modo comparar — selecciona hasta 4 modelos',
  },
};

// ─── ModelCard ────────────────────────────────────────────────────────────────────
function ModelCard({ model, locale, isSelected, isCompareSelected, isCompareMode, hasKey, onClick }) {
  const t = STRINGS[locale] ?? STRINGS.en;
  const badges = useMemo(() => getCapabilityBadges(model), [model]);
  const providerColor = PROVIDER_COLORS[model.provider] ?? 'text-zinc-300 bg-zinc-800';
  const needsKey = !model.supportsMock && !model.supportsServerKey && model.supportsBYOK && !hasKey;

  const isHighlighted = isCompareMode ? isCompareSelected : isSelected;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isHighlighted}
      className={[
        'relative flex flex-col gap-2 p-3 rounded-xl border text-left transition-all duration-150',
        'hover:border-violet-500/60 hover:bg-zinc-800/80',
        isHighlighted
          ? 'border-violet-500 bg-zinc-800 ring-2 ring-violet-500/40'
          : 'border-zinc-700 bg-zinc-900',
      ].join(' ')}
    >
      {/* Provider badge */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${providerColor}`}>
          {model.provider}
        </span>
        <div className="flex items-center gap-1">
          {needsKey && (
            <span className="text-amber-400 text-xs" title={t.missingKey}>⚠️</span>
          )}
          {model.supportsMock && (
            <ModelRoutingBadge badge="Mock" size="xs" />
          )}
        </div>
      </div>

      {/* Model name */}
      <div className="font-semibold text-sm text-zinc-100 leading-tight">
        {locale === 'es' ? model.displayNameEs : model.displayName}
      </div>

      {/* Capability badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map(b => (
            <ModelRoutingBadge key={b} badge={b} size="xs" />
          ))}
        </div>
      )}

      {/* Tier row */}
      <div className="flex items-center gap-2 mt-auto pt-1 border-t border-zinc-800">
        {/* Cost */}
        <span className="flex items-center gap-1 text-[10px] text-zinc-400">
          <span className={`inline-block w-2 h-2 rounded-full ${COST_DOT[model.costTier] ?? 'bg-zinc-500'}`} />
          {COST_LABEL[model.costTier]?.[locale] ?? model.costTier}
        </span>

        {/* Speed */}
        <span className="text-[11px]" title={model.speedTier}>
          {SPEED_ICON[model.speedTier] ?? '⏱️'}
        </span>

        {/* Quality */}
        <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${QUALITY_STYLE[model.qualityTier] ?? 'bg-zinc-700 text-zinc-400'}`}>
          {model.qualityTier}
        </span>
      </div>

      {/* Notes tooltip */}
      {model.notes && (
        <p className="text-[10px] text-zinc-500 truncate" title={model.notes}>{model.notes}</p>
      )}

      {/* Selected indicator */}
      {isHighlighted && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-violet-500" />
      )}
    </button>
  );
}

// ─── SupercomputerPanel ───────────────────────────────────────────────────────────
export default function SupercomputerPanel({
  onModelSelect,
  onModeChange,
  initialMode = 'auto-best',
  locale = 'en',
  availableProviders = [],
}) {
  const t = STRINGS[locale] ?? STRINGS.en;
  const [selectedMode, setSelectedMode] = useState(initialMode);
  const [selectedModel, setSelectedModel] = useState(null);
  const [compareSelected, setCompareSelected] = useState([]);

  const providerSet = useMemo(() => new Set(availableProviders), [availableProviders]);
  const isCompareMode = selectedMode === 'compare';

  function handleModeClick(modeId) {
    setSelectedMode(modeId);
    setCompareSelected([]);
    setSelectedModel(null);
    onModeChange?.(modeId);
  }

  function handleModelClick(model) {
    if (isCompareMode) {
      setCompareSelected(prev => {
        const exists = prev.some(m => m.modelId === model.modelId);
        if (exists) {
          const next = prev.filter(m => m.modelId !== model.modelId);
          onModelSelect?.(next);
          return next;
        }
        if (prev.length >= 4) return prev; // max 4
        const next = [...prev, model];
        onModelSelect?.(next);
        return next;
      });
    } else {
      setSelectedModel(model);
      onModelSelect?.(model);
    }
  }

  return (
    <div className="flex flex-col gap-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-100 tracking-tight">
          {t.title}
        </h2>
        <span className="text-xs text-zinc-500">{MODEL_REGISTRY.length} models</span>
      </div>

      {/* Routing Mode pills */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{t.routingMode}</p>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {ROUTING_MODES.map(mode => {
            const active = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeClick(mode.id)}
                title={locale === 'es' ? mode.descriptionEs : mode.description}
                className={[
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border',
                  active
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-violet-500/50 hover:text-zinc-100',
                ].join(' ')}
              >
                {locale === 'es' ? mode.displayNameEs : mode.displayName}
              </button>
            );
          })}
        </div>
      </div>

      {/* Compare mode notice */}
      {isCompareMode && (
        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/50 rounded-lg px-3 py-2">
          <span>⚡</span>
          <span>{t.compare} ({compareSelected.length}/4)</span>
        </div>
      )}

      {/* Model grid */}
      <div>
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{t.models}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {MODEL_REGISTRY.map(model => {
            const hasKey = providerSet.has(model.provider) || model.supportsServerKey || model.supportsMock;
            const isSelected = !isCompareMode && selectedModel?.modelId === model.modelId;
            const isCompareSelected = isCompareMode && compareSelected.some(m => m.modelId === model.modelId);

            return (
              <ModelCard
                key={`${model.provider}/${model.modelId}`}
                model={model}
                locale={locale}
                isSelected={isSelected}
                isCompareSelected={isCompareSelected}
                isCompareMode={isCompareMode}
                hasKey={hasKey}
                onClick={() => handleModelClick(model)}
              />
            );
          })}
        </div>
      </div>

      {/* Selected model detail */}
      {!isCompareMode && selectedModel && (
        <div className="rounded-xl bg-zinc-800 border border-violet-700/50 p-3 flex items-start gap-3">
          <span className="text-violet-400 text-lg">✓</span>
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {locale === 'es' ? selectedModel.displayNameEs : selectedModel.displayName}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              {selectedModel.provider} · {selectedModel.costTier} cost · {selectedModel.speedTier} speed · {selectedModel.qualityTier} quality
            </p>
            {selectedModel.notes && (
              <p className="text-xs text-amber-400 mt-1">{selectedModel.notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
