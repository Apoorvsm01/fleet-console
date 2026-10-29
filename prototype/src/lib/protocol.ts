/** Post-incident protocol. Fixed order, every step shown, none skippable: the protocol never depends on the lead's judgment (D-020). Wording is invented and needs safety-owner review. */
export const PROTOCOL_STEPS = [
  { id: 'safe', title: 'Confirm the operator is safe', hint: 'Speak to them directly. Ask them to say their name and where they are.' },
  { id: 'location', title: 'Vehicle is in a safe location', hint: 'Hazards on, stopped clear of traffic, or operator and others out of the vehicle.' },
  { id: 'emergency', title: 'Emergency services: dispatched, or operator confirms none needed', hint: 'Ask the question every time. Record the answer in the incident notes.' },
  { id: 'preserve', title: 'Preserve data: do not power-cycle or wipe the vehicle', hint: 'Onboard logs and footage stay as they are until the Review team clears them.' },
  { id: 'notify', title: 'Tell the next responder what you know', hint: 'Hand off in the rota if you cannot stay on this until it is resolved.' },
] as const
export type ProtocolStepId = (typeof PROTOCOL_STEPS)[number]['id']
