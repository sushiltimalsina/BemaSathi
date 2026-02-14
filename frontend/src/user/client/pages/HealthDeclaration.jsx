import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    DocumentTextIcon,
    ClockIcon,
    HeartIcon,
    UserGroupIcon
} from "@heroicons/react/24/outline";

const GENERAL_HEALTH_QUESTIONS = [
    {
        id: "doctor_visit",
        question: "Have you consulted a doctor in the last 12 months?",
        type: "yes_no",
        followUp: "doctor_reason"
    },
    {
        id: "doctor_reason",
        question: "What was the primary reason for your doctor visit?",
        type: "text",
        showIf: { doctor_visit: "yes" }
    },
    {
        id: "medication",
        question: "Are you currently taking any medication regularly?",
        type: "yes_no",
        followUp: "medication_details"
    },
    {
        id: "medication_details",
        question: "Please list all medications you are currently taking:",
        type: "textarea",
        showIf: { medication: "yes" }
    },
    {
        id: "hospitalization",
        question: "Have you been hospitalized in the last 5 years?",
        type: "yes_no",
        followUp: "hospitalization_details"
    },
    {
        id: "hospitalization_details",
        question: "Please provide details (reason, duration, hospital name):",
        type: "textarea",
        showIf: { hospitalization: "yes" }
    },
    {
        id: "surgery",
        question: "Have you undergone any surgery in the last 5 years?",
        type: "yes_no",
        followUp: "surgery_details"
    },
    {
        id: "surgery_details",
        question: "Please provide surgery details:",
        type: "textarea",
        showIf: { surgery: "yes" }
    }
];

const SPECIFIC_CONDITIONS = [
    { id: "diabetes", label: "Diabetes", icon: "💉" },
    { id: "hypertension", label: "High Blood Pressure", icon: "❤️" },
    { id: "heart", label: "Heart Disease", icon: "🫀" },
    { id: "asthma", label: "Asthma / Respiratory Issues", icon: "🫁" },
    { id: "kidney", label: "Kidney Disease", icon: "🩺" },
    { id: "liver", label: "Liver Disease", icon: "🏥" },
    { id: "cancer", label: "Cancer (any type)", icon: "🎗️" },
    { id: "thyroid", label: "Thyroid Disorder", icon: "⚕️" },
    { id: "mental_health", label: "Mental Health Conditions", icon: "🧠" },
    { id: "arthritis", label: "Arthritis / Joint Problems", icon: "🦴" }
];

const CASE_STUDY = {
    title: "⚠️ Real Claim Rejection Case",
    name: "Mr. Sharma",
    age: 42,
    policy: "Family Health Insurance - ₹10 Lakh",
    incident: "Hospitalized for diabetic complications",
    claimAmount: "₹5,00,000",
    outcome: "CLAIM REJECTED",
    reason: "Non-disclosure of pre-existing diabetes during policy purchase",
    loss: {
        claimRejected: "₹5,00,000",
        premiumsForfeited: "₹48,000 (4 years)",
        totalLoss: "₹5,48,000"
    },
    lesson: "He thought 'controlled diabetes' didn't need to be declared. He was wrong."
};

const HealthDeclaration = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(1);
    const [generalAnswers, setGeneralAnswers] = useState({});
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [familyConditions, setFamilyConditions] = useState([]);
    const [finalDeclaration, setFinalDeclaration] = useState({
        truthful: false,
        understand: false,
        consequences: false,
        signature: ""
    });
    const [showCaseStudy, setShowCaseStudy] = useState(true);
    const [timeSpent, setTimeSpent] = useState(0);

    // Track time spent on page (fraud detection metric)
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const shouldShowQuestion = (question) => {
        if (!question.showIf) return true;
        const [key, value] = Object.entries(question.showIf)[0];
        return generalAnswers[key] === value;
    };

    const handleGeneralAnswer = (questionId, value) => {
        setGeneralAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const toggleCondition = (conditionId, isFamily = false) => {
        if (isFamily) {
            setFamilyConditions(prev =>
                prev.includes(conditionId)
                    ? prev.filter(c => c !== conditionId)
                    : [...prev, conditionId]
            );
        } else {
            setSelectedConditions(prev =>
                prev.includes(conditionId)
                    ? prev.filter(c => c !== conditionId)
                    : [...prev, conditionId]
            );
        }
    };

    const canProceedToNextStep = () => {
        if (currentStep === 1) {
            // Must answer all general questions
            const requiredQuestions = GENERAL_HEALTH_QUESTIONS.filter(q => shouldShowQuestion(q));
            return requiredQuestions.every(q => generalAnswers[q.id]);
        }
        if (currentStep === 2) {
            // Must review conditions (can select none)
            return true;
        }
        if (currentStep === 3) {
            // Must check all declarations and sign
            return (
                finalDeclaration.truthful &&
                finalDeclaration.understand &&
                finalDeclaration.consequences &&
                finalDeclaration.signature.trim().length > 0
            );
        }
        return false;
    };

    const handleSubmit = () => {
        const healthData = {
            generalAnswers,
            selectedConditions,
            familyConditions,
            finalDeclaration,
            timeSpent,
            timestamp: new Date().toISOString()
        };

        // Store in session/state for payment page
        sessionStorage.setItem("healthDeclaration", JSON.stringify(healthData));

        // Navigate to payment or next step
        navigate(location.state?.returnTo || "/client/payment", {
            state: { healthDeclarationCompleted: true }
        });
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark py-12 px-4">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-light/10 mb-6">
                        <ShieldCheckIcon className="w-10 h-10 text-primary-light" />
                    </div>
                    <h1 className="text-4xl font-black mb-4 bg-gradient-to-r from-primary-light to-primary-dark bg-clip-text text-transparent">
                        Health Declaration
                    </h1>
                    <p className="text-lg opacity-70 max-w-2xl mx-auto">
                        Complete and honest disclosure ensures smooth claim settlement. This is a <span className="font-bold text-primary-light">legally binding</span> declaration.
                    </p>
                </div>

                {/* Progress Indicator */}
                <div className="mb-12">
                    <div className="flex items-center justify-between mb-4">
                        {[1, 2, 3].map(step => (
                            <div key={step} className="flex items-center flex-1">
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 transition-all ${currentStep >= step
                                        ? 'border-primary-light bg-primary-light text-white'
                                        : 'border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark'
                                    }`}>
                                    {currentStep > step ? (
                                        <CheckCircleIcon className="w-6 h-6" />
                                    ) : (
                                        <span className="font-black">{step}</span>
                                    )}
                                </div>
                                {step < 3 && (
                                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${currentStep > step ? 'bg-primary-light' : 'bg-border-light dark:bg-border-dark'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-xs font-bold opacity-60 px-2">
                        <span>General Health</span>
                        <span>Specific Conditions</span>
                        <span>Final Declaration</span>
                    </div>
                </div>

                {/* Case Study Warning (Dismissible) */}
                {showCaseStudy && (
                    <div className="mb-8 bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-8 relative animate-in slide-in-from-top duration-500">
                        <button
                            onClick={() => setShowCaseStudy(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-red-500/20 rounded-full transition-all"
                        >
                            <XCircleIcon className="w-5 h-5 text-red-500" />
                        </button>

                        <div className="flex items-start gap-4 mb-4">
                            <ExclamationTriangleIcon className="w-8 h-8 text-red-500 flex-shrink-0" />
                            <div>
                                <h3 className="text-xl font-black text-red-600 mb-2">{CASE_STUDY.title}</h3>
                                <p className="text-sm opacity-80 mb-4">{CASE_STUDY.lesson}</p>
                            </div>
                        </div>

                        <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-6 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="opacity-60 text-xs uppercase font-bold mb-1">Policyholder</p>
                                    <p className="font-bold">{CASE_STUDY.name}, {CASE_STUDY.age} years</p>
                                </div>
                                <div>
                                    <p className="opacity-60 text-xs uppercase font-bold mb-1">Policy</p>
                                    <p className="font-bold">{CASE_STUDY.policy}</p>
                                </div>
                                <div>
                                    <p className="opacity-60 text-xs uppercase font-bold mb-1">Claim Amount</p>
                                    <p className="font-bold text-lg">{CASE_STUDY.claimAmount}</p>
                                </div>
                                <div>
                                    <p className="opacity-60 text-xs uppercase font-bold mb-1">Outcome</p>
                                    <p className="font-black text-red-600 text-lg">{CASE_STUDY.outcome}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-red-500/20">
                                <p className="text-xs opacity-60 uppercase font-bold mb-2">Total Financial Loss</p>
                                <p className="text-3xl font-black text-red-600">₹{CASE_STUDY.loss.totalLoss}</p>
                                <p className="text-xs opacity-60 mt-1">
                                    Claim Rejected + Premiums Forfeited
                                </p>
                            </div>
                        </div>

                        <p className="mt-4 text-sm font-bold text-center text-red-600">
                            Don't let this happen to you. Declare honestly. ✓
                        </p>
                    </div>
                )}

                {/* Step Content */}
                <div className="bg-card-light dark:bg-card-dark rounded-[2.5rem] p-10 shadow-2xl border border-border-light dark:border-border-dark">

                    {/* STEP 1: General Health Questions */}
                    {currentStep === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
                            <div className="flex items-center gap-3 mb-8">
                                <DocumentTextIcon className="w-6 h-6 text-primary-light" />
                                <h2 className="text-2xl font-black">General Health Questions</h2>
                            </div>

                            {GENERAL_HEALTH_QUESTIONS.filter(shouldShowQuestion).map((question, idx) => (
                                <div key={question.id} className="space-y-3 animate-in slide-in-from-left duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <label className="text-sm font-bold opacity-80 block">
                                        {idx + 1}. {question.question}
                                        {question.type !== "yes_no" && <span className="text-red-500 ml-1">*</span>}
                                    </label>

                                    {question.type === "yes_no" && (
                                        <div className="flex gap-4">
                                            <button
                                                type="button"
                                                onClick={() => handleGeneralAnswer(question.id, "yes")}
                                                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm border-2 transition-all ${generalAnswers[question.id] === "yes"
                                                        ? 'border-primary-light bg-primary-light text-white shadow-lg scale-105'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary-light/50'
                                                    }`}
                                            >
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleGeneralAnswer(question.id, "no")}
                                                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm border-2 transition-all ${generalAnswers[question.id] === "no"
                                                        ? 'border-green-500 bg-green-500 text-white shadow-lg scale-105'
                                                        : 'border-border-light dark:border-border-dark hover:border-green-500/50'
                                                    }`}
                                            >
                                                No
                                            </button>
                                        </div>
                                    )}

                                    {question.type === "text" && (
                                        <input
                                            type="text"
                                            value={generalAnswers[question.id] || ""}
                                            onChange={(e) => handleGeneralAnswer(question.id, e.target.value)}
                                            className="w-full px-5 py-4 rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none"
                                            placeholder="Please provide details..."
                                        />
                                    )}

                                    {question.type === "textarea" && (
                                        <textarea
                                            value={generalAnswers[question.id] || ""}
                                            onChange={(e) => handleGeneralAnswer(question.id, e.target.value)}
                                            rows={4}
                                            className="w-full px-5 py-4 rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none resize-none"
                                            placeholder="Please provide complete details..."
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 2: Specific Conditions */}
                    {currentStep === 2 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
                            <div className="flex items-center gap-3 mb-8">
                                <HeartIcon className="w-6 h-6 text-primary-light" />
                                <h2 className="text-2xl font-black">Specific Medical Conditions</h2>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
                                <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                    ⚠️ Please select ALL conditions that apply to you or any family member covered under this policy. Even if controlled by medication, it must be declared.
                                </p>
                            </div>

                            {/* Individual Conditions */}
                            <div>
                                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary-light"></span>
                                    Your Medical Conditions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {SPECIFIC_CONDITIONS.map(condition => {
                                        const isSelected = selectedConditions.includes(condition.id);
                                        return (
                                            <button
                                                key={condition.id}
                                                type="button"
                                                onClick={() => toggleCondition(condition.id)}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${isSelected
                                                        ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary-light/50'
                                                    }`}
                                            >
                                                <span className="text-3xl">{condition.icon}</span>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm">{condition.label}</p>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Family Conditions */}
                            <div className="pt-8 border-t border-border-light dark:border-border-dark">
                                <h3 className="text-lg font-black mb-4 flex items-center gap-2">
                                    <UserGroupIcon className="w-5 h-5 text-primary-light" />
                                    Family Members' Medical Conditions
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {SPECIFIC_CONDITIONS.map(condition => {
                                        const isSelected = familyConditions.includes(condition.id);
                                        return (
                                            <button
                                                key={condition.id}
                                                type="button"
                                                onClick={() => toggleCondition(condition.id, true)}
                                                className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${isSelected
                                                        ? 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                                                        : 'border-border-light dark:border-border-dark hover:border-primary-light/50'
                                                    }`}
                                            >
                                                <span className="text-3xl">{condition.icon}</span>
                                                <div className="flex-1">
                                                    <p className="font-bold text-sm">{condition.label}</p>
                                                </div>
                                                {isSelected && (
                                                    <CheckCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mt-8">
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                    💡 If you have NO pre-existing conditions, simply proceed to the next step without selecting anything.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Final Declaration */}
                    {currentStep === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right duration-500">
                            <div className="flex items-center gap-3 mb-8">
                                <ShieldCheckIcon className="w-6 h-6 text-primary-light" />
                                <h2 className="text-2xl font-black">Final Legal Declaration</h2>
                            </div>

                            {/* Summary */}
                            <div className="bg-background-light dark:bg-white/5 rounded-2xl p-6 space-y-4">
                                <h3 className="font-black text-lg mb-4">Your Declaration Summary:</h3>

                                <div>
                                    <p className="text-xs uppercase font-bold opacity-60 mb-2">Your Conditions:</p>
                                    {selectedConditions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedConditions.map(id => {
                                                const condition = SPECIFIC_CONDITIONS.find(c => c.id === id);
                                                return (
                                                    <span key={id} className="px-3 py-1 bg-red-500/10 text-red-600 rounded-full text-xs font-bold">
                                                        {condition?.icon} {condition?.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm opacity-60 italic">No pre-existing conditions declared</p>
                                    )}
                                </div>

                                <div>
                                    <p className="text-xs uppercase font-bold opacity-60 mb-2">Family Conditions:</p>
                                    {familyConditions.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {familyConditions.map(id => {
                                                const condition = SPECIFIC_CONDITIONS.find(c => c.id === id);
                                                return (
                                                    <span key={id} className="px-3 py-1 bg-red-500/10 text-red-600 rounded-full text-xs font-bold">
                                                        {condition?.icon} {condition?.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm opacity-60 italic">No family conditions declared</p>
                                    )}
                                </div>
                            </div>

                            {/* Legal Declarations */}
                            <div className="space-y-4">
                                <label className="flex gap-4 p-5 rounded-2xl border-2 border-border-light dark:border-border-dark hover:border-primary-light/50 cursor-pointer transition-all group">
                                    <input
                                        type="checkbox"
                                        checked={finalDeclaration.truthful}
                                        onChange={(e) => setFinalDeclaration(prev => ({ ...prev, truthful: e.target.checked }))}
                                        className="w-6 h-6 rounded border-2 border-border-light dark:border-border-dark checked:bg-primary-light checked:border-primary-light cursor-pointer flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-sm font-bold group-hover:text-primary-light transition-colors">
                                        I declare that ALL information provided is <span className="text-primary-light">TRUE and COMPLETE</span> to the best of my knowledge.
                                    </span>
                                </label>

                                <label className="flex gap-4 p-5 rounded-2xl border-2 border-border-light dark:border-border-dark hover:border-primary-light/50 cursor-pointer transition-all group">
                                    <input
                                        type="checkbox"
                                        checked={finalDeclaration.understand}
                                        onChange={(e) => setFinalDeclaration(prev => ({ ...prev, understand: e.target.checked }))}
                                        className="w-6 h-6 rounded border-2 border-border-light dark:border-border-dark checked:bg-primary-light checked:border-primary-light cursor-pointer flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-sm font-bold group-hover:text-primary-light transition-colors">
                                        I understand that <span className="text-red-500">NON-DISCLOSURE or MISREPRESENTATION</span> will make this policy NULL and VOID.
                                    </span>
                                </label>

                                <label className="flex gap-4 p-5 rounded-2xl border-2 border-border-light dark:border-border-dark hover:border-primary-light/50 cursor-pointer transition-all group">
                                    <input
                                        type="checkbox"
                                        checked={finalDeclaration.consequences}
                                        onChange={(e) => setFinalDeclaration(prev => ({ ...prev, consequences: e.target.checked }))}
                                        className="w-6 h-6 rounded border-2 border-border-light dark:border-border-dark checked:bg-primary-light checked:border-primary-light cursor-pointer flex-shrink-0 mt-0.5"
                                    />
                                    <span className="text-sm font-bold group-hover:text-primary-light transition-colors">
                                        I accept that false declaration may result in <span className="text-red-500">CLAIM REJECTION, PREMIUM FORFEITURE, and LEGAL ACTION</span>.
                                    </span>
                                </label>
                            </div>

                            {/* Signature */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold opacity-80 block">
                                    Digital Signature (Type your full name) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={finalDeclaration.signature}
                                    onChange={(e) => setFinalDeclaration(prev => ({ ...prev, signature: e.target.value }))}
                                    className="w-full px-5 py-4 rounded-2xl bg-background-light dark:bg-card-dark/50 border border-border-light dark:border-border-dark focus:ring-4 focus:ring-primary-light/10 focus:border-primary-light transition-all outline-none font-signature text-2xl"
                                    placeholder="Your Full Name"
                                />
                                <p className="text-xs opacity-60 flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4" />
                                    Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                    ✓ This declaration is legally binding and will be stored securely. You will receive a copy via email.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-12 pt-8 border-t border-border-light dark:border-border-dark">
                        {currentStep > 1 && (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev - 1)}
                                className="px-8 py-4 rounded-2xl border-2 border-border-light dark:border-border-dark font-bold hover:border-primary-light/50 transition-all"
                            >
                                ← Previous
                            </button>
                        )}

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                disabled={!canProceedToNextStep()}
                                className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${canProceedToNextStep()
                                        ? 'bg-primary-light text-white hover:bg-primary-dark shadow-lg shadow-primary-light/30'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Continue to Next Step →
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canProceedToNextStep()}
                                className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${canProceedToNextStep()
                                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Submit Declaration & Proceed to Payment →
                            </button>
                        )}
                    </div>
                </div>

                {/* Time Tracker (Hidden - for fraud detection) */}
                <input type="hidden" value={timeSpent} />
            </div>
        </div>
    );
};

export default HealthDeclaration;
