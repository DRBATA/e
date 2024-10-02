import React, { useState, useMemo, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InfoIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

const conditionsData = {
  "Flu": {
    "symptoms": ["Sore throat", "Dry cough", "Tiredness", "Unwell", "Body aches and pains", "Headache", "Fever", "Blocked nose"],
    "medications": ["Paracetamol", "Ibuprofen Caplets", "Beechams Cold and Flu Powder"],
    "wellness_words": ["resting", "hydrated", "recovering", "improving"],
    "unwellness_words": ["exhausted", "feverish", "achy", "miserable"],
    "color": "bg-red-500"
  },
  "Cold": {
    "symptoms": ["Sore throat", "Wet cough", "Blanching red rash", "Body aches and pains", "Headache", "Fever", "Blocked nose"],
    "medications": ["Paracetamol", "Ibuprofen Caplets", "Beechams Cold and Flu Powder"],
    "wellness_words": ["mild", "manageable", "improving", "hydrated"],
    "unwellness_words": ["congested", "sneezing", "runny nose", "sore"],
    "color": "bg-blue-500"
  },
  "Strep Throat": {
    "symptoms": ["Sore throat", "Dry cough", "Blotchy red rash", "Swollen glands", "Pus on tonsils"],
    "medications": ["Consult a healthcare provider"],
    "wellness_words": ["antibiotics working", "throat less sore", "fever reducing", "swelling down"],
    "unwellness_words": ["severe throat pain", "difficulty swallowing", "high fever", "body aches"],
    "color": "bg-green-500"
  },
  "Bronchitis": {
    "symptoms": ["Wet cough", "Chesty cough", "Body aches and pains"],
    "medications": ["Ibuprofen Caplets", "Beechams Cold and Flu Powder"],
    "wellness_words": ["clearing", "improving", "less congested", "breathing easier"],
    "unwellness_words": ["wheezing", "shortness of breath", "chest tightness", "mucus"],
    "color": "bg-yellow-500"
  },
  "Sinusitis": {
    "symptoms": ["Headache", "Blocked nose", "Facial pressure", "Post-nasal drip"],
    "medications": ["Paracetamol", "Ibuprofen Caplets", "Nasal Decongestants"],
    "wellness_words": ["draining", "pressure relieving", "breathing easier", "headache reducing"],
    "unwellness_words": ["facial pain", "thick nasal discharge", "loss of smell", "toothache"],
    "color": "bg-purple-500"
  },
  "Allergies": {
    "symptoms": ["Congestion", "Post-nasal drip", "Allergic conjunctivitis", "Sneezing", "Runny nose"],
    "medications": ["Antihistamines", "Nasal Decongestants"],
    "wellness_words": ["less sneezing", "eyes clearing", "breathing easier", "less itchy"],
    "unwellness_words": ["constant sneezing", "itchy eyes", "runny nose", "sinus pressure"],
    "color": "bg-pink-500"
  }
}

const allSymptoms = Array.from(new Set(Object.values(conditionsData).flatMap(condition => condition.symptoms)))
const allWellnessWords = Array.from(new Set(Object.values(conditionsData).flatMap(condition => condition.wellness_words)))
const allUnwellnessWords = Array.from(new Set(Object.values(conditionsData).flatMap(condition => condition.unwellness_words)))

function createSymptomVector(userInput) {
  return allSymptoms.map(symptom => userInput.toLowerCase().includes(symptom.toLowerCase()) ? 1 : 0)
}

function createWellnessVector(userInput, condition) {
  const wellnessWords = conditionsData[condition].wellness_words
  const unwellnessWords = conditionsData[condition].unwellness_words
  const allWords = [...wellnessWords, ...unwellnessWords]
  return allWords.map((word, index) => 
    userInput.toLowerCase().includes(word.toLowerCase()) ? (index < wellnessWords.length ? 1 : -1) : 0
  )
}

function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0))
  return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0
}

function getRecommendations(topCondition, wellnessScore) {
  if (wellnessScore > 0.7) {
    return `Your wellness score for ${topCondition} is high. Continue to monitor symptoms and maintain good health practices.`
  } else if (wellnessScore > 0.4) {
    return `Your wellness score for ${topCondition} is moderate. Rest, stay hydrated, and manage symptoms. If symptoms persist or worsen, consult a healthcare professional.`
  } else {
    return `Your wellness score for ${topCondition} is low. It's advisable to consult a healthcare professional about your symptoms related to ${topCondition}.`
  }
}

export function SymptomCheckerComponent() {
  const [freeTextInput, setFreeTextInput] = useState("")
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [selectedCondition, setSelectedCondition] = useState(null)
  const [tonsilStatus, setTonsilStatus] = useState("")
  const [glandStatus, setGlandStatus] = useState("")
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [conditionScores, setConditionScores] = useState([])
  const [topCondition, setTopCondition] = useState("")
  const [wellnessScore, setWellnessScore] = useState(0)
  const [recommendation, setRecommendation] = useState("")

  const toggleSymptom = (symptomId) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptomId) ? prev.filter(id => id !== symptomId) : [...prev, symptomId]
    )
  }

  useEffect(() => {
    const userSymptomVector = createSymptomVector(freeTextInput)
    const scores = Object.keys(conditionsData).map(condition => {
      const conditionSymptomVector = allSymptoms.map(symptom => 
        conditionsData[condition].symptoms.includes(symptom) ? 1 : 0
      )
      const symptomSimilarity = cosineSimilarity(userSymptomVector, conditionSymptomVector)
      const wellnessVector = createWellnessVector(freeTextInput, condition)
      const wellnessScore = wellnessVector.length > 0 ? wellnessVector.reduce((a, b) => a + b, 0) / wellnessVector.length : 0
      const conditionScore = (symptomSimilarity + wellnessScore) / 2
      return { condition, conditionScore, medications: conditionsData[condition].medications }
    })
    scores.sort((a, b) => b.conditionScore - a.conditionScore)
    setConditionScores(scores)
    if (scores.length > 0) {
      setTopCondition(scores[0].condition)
      setWellnessScore(scores[0].conditionScore)
    }
  }, [freeTextInput])

  useEffect(() => {
    const words = freeTextInput.toLowerCase().split(/\s+/)
    const detectedSymptoms = allSymptoms.filter(symptom => 
      words.some(word => symptom.toLowerCase().includes(word))
    )
    setSelectedSymptoms(detectedSymptoms)
  }, [freeTextInput])

  const handleGetRecommendations = () => {
    if (topCondition) {
      const rec = getRecommendations(topCondition, wellnessScore)
      setRecommendation(rec)
      setShowRecommendation(true)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">EasyGP Symptom Checker</h1>
      <p className="mb-4">It's okay if you're not sure about what might be causing your symptoms. EasyGP is here to help!</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Describe Your Symptoms</h2>
              <Textarea
                placeholder="Describe how you're feeling..."
                value={freeTextInput}
                onChange={(e) => setFreeTextInput(e.target.value)}
                className="w-full h-32"
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Symptoms</h2>
              <div className="grid grid-cols-2 gap-4">
                {allSymptoms.map((symptom) => (
                  <div key={symptom} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom}
                      checked={selectedSymptoms.includes(symptom)}
                      onCheckedChange={() => toggleSymptom(symptom)}
                    />
                    <label
                      htmlFor={symptom}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        selectedCondition && conditionsData[selectedCondition].symptoms.includes(symptom)
                          ? conditionsData[selectedCondition].color
                          : ''
                      }`}
                    >
                      {symptom}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  Tonsil Status
                  <TonsilInfoDialog />
                </h2>
                <Select onValueChange={setTonsilStatus} value={tonsilStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select tonsil status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="inflamed-no-swelling">Inflamed throat but no tonsil swelling</SelectItem>
                    <SelectItem value="swollen-with-pus">Swollen with lots of pus</SelectItem>
                    <SelectItem value="very-swollen">Very swollen</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2 flex items-center">
                  Gland Status
                  <GlandInfoDialog />
                </h2>
                <Select onValueChange={setGlandStatus} value={glandStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gland status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="slightly-swollen">Slightly swollen</SelectItem>
                    <SelectItem value="very-swollen">Very swollen</SelectItem>
                    <SelectItem value="asymmetrical">Asymmetrical swelling</SelectItem>
                    <SelectItem value="painful">Painful</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Conditions</h2>
              <div className="flex flex-wrap gap-2">
                {Object.keys(conditionsData).map((condition) => (
                  <Button
                    key={condition}
                    variant="outline"
                    className={`${conditionsData[condition].color} ${selectedCondition === condition ? 'ring-2 ring-black' : ''}`}
                    onClick={() => setSelectedCondition(condition)}
                  >
                    {condition}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h2 className="text-xl font-semibold mb-2">Probability</h2>
              {selectedCondition && (
                <div className="relative w-48 h-48 mx-auto">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke="#e6e6e6"
                      strokeWidth="10"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke={conditionsData[selectedCondition].color.replace('bg-', '')}
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - (conditionScores.find(c => c.condition === selectedCondition)?.conditionScore || 0))}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">
                      {Math.round((conditionScores.find(c => c.condition === selectedCondition)?.conditionScore || 0) * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Button className="w-full mt-4" onClick={handleGetRecommendations}>Get Recommendations</Button>
      {showRecommendation && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <h2 className="text-xl font-semibold mb-2">Recommendation</h2>
            <p>{recommendation}</p>
            <p className="mt-2">Top Condition: {topCondition}</p>
            <p>Wellness Score: {(wellnessScore * 100).toFixed(2)}%</p>
            <p className="mt-2">Recommended Medications for {topCondition}:</p>
            <ul className="list-disc list-inside">
              {conditionsData[topCondition]?.medications.map((med, index) => (
                <li key={index}>{med}</li>
              ))}
            </ul>
            <p className="mt-4">Other potential conditions:</p>
            <ul className="list-disc list-inside">
              {conditionScores.slice(1, 4).map((cond, index) => (
                <li key={index}>{cond.condition}: {(cond.conditionScore * 100).toFixed(2)}%</li>
              ))}
            </ul>
            <p className="text-sm mt-4">Disclaimer: This assessment is for informational purposes only and does not replace professional medical advice.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TonsilInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="ml-2">
          <InfoIcon className="h-4 w-4" />
          <span className="sr-only">Tonsil Examination Instructions</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to Examine Your Tonsils</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>1. Prepare the area: Stand in front of a mirror in a well-lit room. Use a flashlight or your phone's light if needed.</p>
          <p>2. Clear your throat: Drink water or rinse your mouth to remove food particles.</p>
          <p>3. Position yourself: Open your mouth wide and stick out your tongue or press it down.</p>
          <p>4. Use a spoon: Gently place a clean spoon handle on your tongue to keep it down.</p>
          <p>5. Say "Ahhh": This raises the soft palate and exposes your tonsils.</p>
          <p>6. Shine the light: Direct it towards the back of your throat.</p>
          <p>7. Observe your tonsils: Look for redness, swelling, white spots, or yellow coating.</p>
          <p>Be gentle and don't force the examination if uncomfortable. Consult a healthcare professional if you have concerns.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function GlandInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="ml-2">
          <InfoIcon className="h-4 w-4" />
          <span className="sr-only">Gland Examination Instructions</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to Check Your Glands</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p>1. Stand in front of a mirror with your neck exposed. Tilt your head slightly forward.</p>
          <p>2. Use your fingertips to gently press and feel the following areas:</p>
          <ul className="list-disc list-inside">
            <li>Under the jaw and chin</li>
            <li>Down the sides of your neck along the large neck muscles</li>
            <li>Behind and below your ears</li>
            <li>Along your collarbone</li>
          </ul>
          <p>3. Use a gentle circular motion as you press. Normal glands should feel like small, round bumps.</p>
          <p>4. Compare both sides of your neck, noting any differences in size or tenderness.</p>
          <p>5. Pay attention to glands that:</p>
          <ul className="list-disc list-inside">
            <li>Feel enlarged compared to surrounding glands</li>
            <li>Are painful or tender to touch</li>
            <li>Have been swollen for more than 4 weeks</li>
            <li>Feel different on one side compared to the other (asymmetry)</li>
          </ul>
          <p>If you have concerns about your glands, consult a healthcare professional.</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}