/**
 * VunaStack Analytics Utility
 * 
 * Type-safe dataLayer event tracking for Google Tag Manager.
 * This file contains all custom behavioral event trackers for the Vunachain landing page.
 * 
 * @module analytics
 */

// Extend the Window interface to include dataLayer
declare global {
    interface Window {
        dataLayer: any[];
    }
}

// Initialize dataLayer if it doesn't exist
window.dataLayer = window.dataLayer || [];

/**
 * Interface for ROI Calculator interaction events
 */
interface ROICalculatorEvent {
    event: 'ROI_Calc_Interaction';
    input_volume: number;        // Annual tonnage in MT
    calculated_loss: number;      // Loss value in currency
    crop_type: string;            // e.g., "Coffee", "Cocoa", "Avocado"
}

/**
 * Interface for form friction events
 */
interface FormFrictionEvent {
    event: 'Form_Friction_Start';
    field_name: string;           // Name of the field that was focused
    timestamp: number;            // Unix timestamp
}

/**
 * Interface for successful pilot request submissions
 */
interface PilotRequestEvent {
    event: 'Pilot_Request_Success';
    company_name: string;         // Submitted company name
    interest_area: string;        // Primary interest (e.g., "EUDR Compliance")
    timestamp: number;            // Unix timestamp
}

/**
 * Task 2: Custom Behavioral Events
 * 
 * Event Name: ROI_Calc_Interaction
 * Trigger: When a user moves the "Annual Tonnage" slider on the ROI calculator
 * Goal: Verify if the "Loss Aversion" nudge is engaging users
 * 
 * @param inputVolume - The annual tonnage value from the slider
 * @param calculatedLoss - The computed loss value displayed to the user
 * @param cropType - The selected crop type (default: "Coffee")
 */
export function trackROICalculatorInteraction(
    inputVolume: number,
    calculatedLoss: number,
    cropType: string = 'Coffee'
): void {
    const event: ROICalculatorEvent = {
        event: 'ROI_Calc_Interaction',
        input_volume: inputVolume,
        calculated_loss: calculatedLoss,
        crop_type: cropType,
    };

    window.dataLayer.push(event);

    // Console log for debugging (remove in production if needed)
    console.log('[VunaStack Analytics] ROI Calculator Interaction:', event);
}

/**
 * Task 2: Custom Behavioral Events
 * 
 * Event Name: Form_Friction_Start
 * Trigger: When the user clicks/focuses on the "Phone Number" input field
 * Goal: Measure form friction and abandonment rates
 * 
 * @param fieldName - Name of the field being focused (default: "phone")
 */
export function trackFormFrictionStart(fieldName: string = 'phone'): void {
    const event: FormFrictionEvent = {
        event: 'Form_Friction_Start',
        field_name: fieldName,
        timestamp: Date.now(),
    };

    window.dataLayer.push(event);

    console.log('[VunaStack Analytics] Form Friction Start:', event);
}

/**
 * Task 2: Custom Behavioral Events
 * 
 * Event Name: Pilot_Request_Success
 * Trigger: On successful form submission
 * Goal: Track conversion events and segment by company type/interest
 * 
 * @param companyName - The company name from the form
 * @param interestArea - The primary interest area selected
 */
export function trackPilotRequestSuccess(
    companyName: string,
    interestArea: string
): void {
    const event: PilotRequestEvent = {
        event: 'Pilot_Request_Success',
        company_name: companyName,
        interest_area: interestArea,
        timestamp: Date.now(),
    };

    window.dataLayer.push(event);

    console.log('[VunaStack Analytics] Pilot Request Success:', event);
}

/**
 * Task 2: Custom Behavioral Events
 * 
 * Event Name: Checklist_Download
 * Trigger: When user submits email to download the compliance checklist
 * Goal: Track lead generation from exit intent nudge
 * 
 * @param email - The email address provided (hashed or raw, depending on privacy policy)
 */
export function trackChecklistDownload(email: string): void {
    const event = {
        event: 'Checklist_Download',
        email_provided: true, // Don't log actual email to GA/GTM PII
        timestamp: Date.now(),
    };

    window.dataLayer.push(event);

    console.log('[VunaStack Analytics] Checklist Download:', event, 'Email provided:', email ? 'Yes' : 'No');
}

/**
 * Generic event tracker for custom events
 * Use this as a fallback for any ad-hoc tracking needs
 * 
 * @param eventName - Name of the custom event
 * @param eventData - Additional data to include with the event
 */
export function trackCustomEvent(eventName: string, eventData: Record<string, unknown> = {}): void {
    const event = {
        event: eventName,
        ...eventData,
        timestamp: Date.now(),
    };

    window.dataLayer.push(event);

    console.log(`[VunaStack Analytics] Custom Event (${eventName}):`, event);
}
