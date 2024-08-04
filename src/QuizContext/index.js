import React from 'react';
import { useLocalStorage } from './useLocalStorage';
import { addData } from '../Supabase/addData'
import { supabase } from '../Supabase/supabaseClient';

const QuizContext = React.createContext();

function QuizProvider({ children }) {
    // const {
    //     item: players,
    //     saveItem: savePlayers
    // } = useLocalStorage('PLM_QUIZ_V1', [])

    const defaultQuestions = [
        'En que año empezo Paren la mano?',
        'Quien popularizo el famoso "EEEEESI"?',
        'Quien es el integrante del programa con mejor asistencia?'
    ]
    
    const defaultOptions = [
        ['2022', '2021', '2023', '2024'],
        ['Alfredo', 'Luquitas', 'German', 'Roberto'],
        ['Alfredo', 'German', 'Roberto', 'Luquitas']
    ]

    const defaultAnswersExplanation = [
        'PLM empezo en 2022, mas especificamente el 1 de marzo fue el primer programa',
        'La broma empezo como una exageracion de grito de messi y rapidamente se hizo furor',
        'Segun Jazmin Badia, Alfredo es el integrante que mas asistio al programa seguido por el intrepido Beder'
    ]

    const aleatory = (max) => {
        return Math.floor(Math.random() * ((max -1) - 0 + 1) + 0)
    }

    const shuffleOptions = (arr) => {
        let newSortedArray = [...arr]
        for (let i = newSortedArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newSortedArray[i], newSortedArray[j]] = [newSortedArray[j], newSortedArray[i]]
        }
        return newSortedArray
    }

    const [gameStarted, setGameStarted] = React.useState(false);
    const [gameOver, setGameOver] = React.useState(false);
    const [questionsArray, setQuestionsArray] = React.useState(defaultQuestions);
    const [optionsArray, setOptionsArray] = React.useState(defaultOptions);
    const [aleatoryNumber, setAleatoryNumber] = React.useState(aleatory(questionsArray.length));
    const [optionsArraySorted, setOptionsArraySorted] = React.useState(shuffleOptions(optionsArray[aleatoryNumber]));
    const [isAnswerCorrect, setIsAnswerCorrect] = React.useState(false);
    const [answer, setAnswer] = React.useState('');
    const [puntaje, setPuntaje] = React.useState(0);
    const [disableOptions, setDisableOptions] = React.useState(false);
    const [timeLeft, setTimeLeft] = React.useState(10); 
    const [isTimerActive, setIsTimerActive] = React.useState(false); 
    const [isTimeOver, setIsTimeOver] = React.useState(false); 
    const [answersExplanation, setAnswersExplanation] = React.useState(defaultAnswersExplanation)
    const [playerName, setPlayerName] = React.useState('')
    const [error, setError] = React.useState(false)
    const [shake, setShake] = React.useState(false)
    const [players, setPlayers] = React.useState([{ name: '', score: '', ranking: '' }]);
    const [playersSupabase, setPlayersSupabase] = React.useState([]);
    
    React.useEffect(() => {
        getPlayers();
    }, []);
  
    async function getPlayers() {
        const { data } = await supabase.from("players").select();
        setPlayersSupabase([...data]);
    }

    const totalAnswers = defaultQuestions.length

    const startGame = () => {
        if (playerName && !isNameAlreadyTaken()) {
            createPlayer()
            setGameStarted(true);
            setIsTimerActive(true);        
        } else {
            setError(true)
            setShake(true)
            setTimeout(() => setShake(false), 200)
            setTimeout(() => setShake(false), 200)
        }
    }

    const checkAnswer = (text) => {
        setDisableOptions(true)
        setTimeout(() => setDisableOptions(false), 2000)
        if (text === optionsArray[aleatoryNumber][0]) {
            updateScore()
            setIsAnswerCorrect(true)
            setAnswer(text)   
            setTimeout(() => setIsAnswerCorrect(false), 2000)
            setTimeout(() => setAnswer(''), 2000)
            setTimeout(() => updateQuestions(), 2000)
        } else if (!text) {
            setIsTimeOver(true)
            setTimeout(() => updateQuestions(), 2000)
            setTimeout(() => setIsTimeOver(false), 2000)
        } else {
            setIsAnswerCorrect(false)
            setAnswer(text)   
            setTimeout(() => updateQuestions(), 2000)
            setTimeout(() => setAnswer(''), 2000)
        }
        setIsTimerActive(false);
    }

    const updateScore = () => {
        let newPuntaje = puntaje
        setPuntaje(prevState => prevState+1)
        const newPlayer = {name:playerName, score:newPuntaje+1, ranking:playersSupabase.length}
        const newPlayers = [...playersSupabase, newPlayer]
        newPlayers.sort((a, b) => b.score - a.score);
        updateRanking(newPlayers)
    }

    const updateRanking = (newPlayers) => {
        for (let i = 0; i < newPlayers.length; i++) {
            newPlayers[i].ranking = i+1
        }

        deleteRecords(newPlayers)
    }

    const deleteRecords = async (newPlayers) => {
        const { error } = await supabase.from('players').delete().gte('id', 0)
        if (error) {
            console.log(error);
        }
        updateRecords(newPlayers)
    }

    const updateRecords = async (updatedData) => {
        console.log(updatedData);
        
        const error = await addData(updatedData);
        if (error) {
            console.log(error);
        }
    }

    const updateQuestions = () => {
        if (questionsArray.length > 1) {
            const newQuestionsArray = [...questionsArray]
            const newOptionsArray = [...optionsArray]
            const newAnswersExplanation = [...answersExplanation]
            newQuestionsArray.splice(aleatoryNumber, 1)
            newOptionsArray.splice(aleatoryNumber, 1)
            newAnswersExplanation.splice(aleatoryNumber, 1)
            let newAleatoryNumber = aleatory(newQuestionsArray.length)
            setQuestionsArray(newQuestionsArray)
            setOptionsArray(newOptionsArray)
            setAnswersExplanation(newAnswersExplanation)
            setAleatoryNumber(newAleatoryNumber)
            setOptionsArraySorted(shuffleOptions(newOptionsArray[newAleatoryNumber]))
            setTimeLeft(10);
            setIsTimerActive(true)
        } else {
            setGameStarted(false)
            setGameOver(true)
        }
    }

    const isNameAlreadyTaken = () => {
        return playersSupabase && playersSupabase.some(obj => obj.name.toLowerCase() === playerName.toLowerCase());
    }

    const createPlayer = async () => {
        const newPlayer = {name:playerName, score:0, ranking:players.length}
        const error = await addData(newPlayer);
        
        // const newPlayers = [...players]
        // newPlayers.push({name: playerName, score:0, ranking:newPlayers.length})
        // savePlayers(newPlayers)
    }

    React.useEffect(() => {
        if (isTimerActive && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            checkAnswer()
        }
    }, [isTimerActive, timeLeft]);

    return (
        <QuizContext.Provider value={{
            gameStarted,
            gameOver,
            setGameStarted,
            questionsArray,
            optionsArray,
            aleatoryNumber,
            optionsArraySorted,
            isAnswerCorrect,
            answer,
            puntaje,
            disableOptions,
            timeLeft,
            setIsTimerActive,
            isTimeOver,
            totalAnswers,
            checkAnswer,
            shuffleOptions,
            answersExplanation,
            playerName,
            setPlayerName,
            isNameAlreadyTaken,
            error,
            setError,
            shake,
            setShake,
            createPlayer,
            players,
            startGame,
            playersSupabase
        }}>
            {children}
        </QuizContext.Provider>
    );
}

export { QuizContext, QuizProvider };