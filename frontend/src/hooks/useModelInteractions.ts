import { create } from 'zustand'
import * as THREE from 'three'

interface ModelInteractionState {
  selectedOrgan: string | null
  hoveredOrgan: string | null
  focusPoint: THREE.Vector3 | null
  cameraLookAt: THREE.Vector3 | null
  
  // Wizard States
  step: 'select-part' | 'select-subpart' | 'select-symptoms' | 'analyzing' | 'results'
  selectedSubPart: string | null
  selectedSymptoms: string[]
  customInput: string
  
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  showSkin: boolean
  showOrgans: boolean
  showSkeleton: boolean
  
  setSelectedOrgan: (organ: string | null, point?: THREE.Vector3) => void
  setHoveredOrgan: (organ: string | null) => void
  
  setStep: (step: ModelInteractionState['step']) => void
  setSelectedSubPart: (subpart: string | null) => void
  toggleSymptom: (symptom: string) => void
  setCustomInput: (input: string) => void
  resetWizard: () => void

  toggleSkin: () => void
  toggleOrgans: () => void
  toggleSkeleton: () => void
  searchOrgan: (searchQuery: string) => void
}

export const useModelInteractions = create<ModelInteractionState>((set) => ({
  selectedOrgan: null,
  hoveredOrgan: null,
  focusPoint: null,
  cameraLookAt: null,

  step: 'select-part',
  selectedSubPart: null,
  selectedSymptoms: [],
  customInput: '',
  searchQuery: '',

  setSearchQuery: (query) => set({ searchQuery: query }),

  showSkin: true,
  showOrgans: true,
  showSkeleton: false,

  setSelectedOrgan: (organ, point) => set((state) => {
    // Determine if it needs subparts or skip to symptoms
    const needsSubparts = organ && ['Torso', 'Head', 'Leg', 'Arm'].includes(organ);
    return { 
      selectedOrgan: organ, 
      focusPoint: point || null,
      step: organ ? (needsSubparts ? 'select-subpart' : 'select-symptoms') : 'select-part',
      selectedSubPart: null,
      selectedSymptoms: [],
      customInput: ''
    };
  }),
  setHoveredOrgan: (organ) => set({ hoveredOrgan: organ }),
  
  setStep: (step) => set({ step }),
  setSelectedSubPart: (subpart) => set({ selectedSubPart: subpart, step: subpart ? 'select-symptoms' : 'select-subpart' }),
  toggleSymptom: (symptom) => set((state) => ({
    selectedSymptoms: state.selectedSymptoms.includes(symptom)
      ? state.selectedSymptoms.filter(s => s !== symptom)
      : [...state.selectedSymptoms, symptom]
  })),
  setCustomInput: (input) => set({ customInput: input }),
  resetWizard: () => set({ 
    selectedOrgan: null, 
    selectedSubPart: null, 
    selectedSymptoms: [], 
    customInput: '', 
    step: 'select-part',
    focusPoint: null,
    searchQuery: ''
  }),

  // Ensuring at least one layer is active to prevent full invisibility
  toggleSkin: () => set((state) => {
      const nextSkin = !state.showSkin;
      if (!nextSkin && !state.showOrgans && !state.showSkeleton) return { showSkin: true }; // Prevent hiding last
      return { showSkin: nextSkin };
  }),
  toggleOrgans: () => set((state) => {
      const nextOrgans = !state.showOrgans;
      if (!state.showSkin && !nextOrgans && !state.showSkeleton) return { showOrgans: true };
      return { showOrgans: nextOrgans };
  }),
  toggleSkeleton: () => set((state) => {
      const nextSkeleton = !state.showSkeleton;
      if (!state.showSkin && !state.showOrgans && !nextSkeleton) return { showSkeleton: true };
      return { showSkeleton: nextSkeleton };
  }),
  
  searchOrgan: (searchQuery) => {
    if (searchQuery && searchQuery.length > 2) {
      // In a real scenario, this would match an organ and trigger setSelectedOrgan dynamically.
      // We will handle specific focus from Models if needed.
    }
  }
}))
