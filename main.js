async function getRandomWords(count) {
    let res = await fetch(`https://random-word-api.herokuapp.com/word?number=${count}`)
        .then(async (response) => {
            if (!response.ok) {
                throw new Error('Error getting data');
            }

            return response.json().then((data) => {
                return data;
            });
        })
        .catch((error) => {
            console.log(error);
        });

    return res;
}

function calculateWPM(total, errors) {
    if (total / 5 <= 0) { return 0; }
    return (total / 5) - errors;
}

function calculateAccuracy(total, errors) {
    if ((total - errors) <= 0) { return 0; }
    return ((total - errors) / total) * 100;
}

function countErrors(input, word) {
    input = input.trim();
    word = word.trim();

    if (input.length == 0) {
        return word.length;
    }

    let errors = 0;
    let arrayLength = 0;
    if (input.length > word.length) {
        errors = input.length - word.length;
        arrayLength = word.length;
    }
    else if (input.length < word.length) {
        errors = word.length - input.length;
        arrayLength = input.length;
    }

    for (let i = 0; i < arrayLength; ++i) {
        console.log(input.charAt(i), word.charAt(i));
        if (input.charAt(i) != word.charAt(i)) {
            ++errors;
        }
    }

    return errors;
}

function formatTime(timeInMilliseconds) {
    const durationTime = new Date(timeInMilliseconds);
    const minutes = durationTime.getMinutes();
    const seconds = durationTime.getSeconds();
    return `${minutes < 10 ? String(minutes).padStart(2, '0') : minutes}:${seconds < 10 ? String(seconds).padStart(2, '0') : seconds}`;
}

/**
 * @var {number} duration The timer duration in seconds
 */
function startTimer(timer, keyboardInput, duration) {
    duration = (duration >= 3600) ? 60 : duration;
    
    const timerId = setInterval(() => {
        --duration;
        
        if (duration > 0) {
            timer.textContent = formatTime(duration * 1000);
        }
        else {
            clearInterval(timerId);
            keyboardInput.disabled = true;
            document.dispatchEvent(new Event('timeover'));
        }

    }, 1000);
}

(async function () {
    const textBox = document.querySelector('#words > .row');
    const restartBtn = document.getElementById('restartBtn');
    const keyboardInput = document.getElementById('inputField');
    const timer = document.getElementById('timer');
    const words = await getRandomWords(300);
    const gameDuration = 60;
    let wordsYAxisValues = [];
    let currentRowIndex = 0;
    let currentWordIndex = 0;
    let totalCorrectWords = 0;
    let totalWrongWords = 0;
    let totalCharsTyped = 0;
    let uncorrectedErrors = 0;
    let isTimerActive = false;

    for (let i = 0; i < words.length; ++i) {
        const wordSpan = document.createElement('SPAN');
        wordSpan.classList.add('word');
        if (i == 0) { wordSpan.classList.add('current'); }
        wordSpan.textContent = words[i];
        textBox.appendChild(wordSpan);
        wordsYAxisValues.push(wordSpan.getBoundingClientRect().top);
    }

    timer.textContent = formatTime(gameDuration * 1000);

    keyboardInput.addEventListener('keyup', e => {
        const currentWord = textBox.children[currentWordIndex];
        const nextWord = textBox.children[currentWordIndex + 1];

        if (!isTimerActive) {
            startTimer(timer, keyboardInput, gameDuration);
            isTimerActive = true;
        }

        if (e.key == ' ') {
            const input = keyboardInput.value.trim();

            if (input == '') {
                keyboardInput.value = '';
                return;
            }

            uncorrectedErrors += countErrors(keyboardInput.value, currentWord.textContent);
            totalCharsTyped += input.length;

            console.log(uncorrectedErrors, totalCharsTyped);

            if (input == currentWord.textContent) {
                currentWord.className = 'word correct';
                ++totalCorrectWords;
            }
            else if (input != currentWord.textContent) {
                currentWord.className = 'word wrong';
                ++totalWrongWords;
            }

            nextWord.className = 'word current';
            keyboardInput.value = '';
            ++currentWordIndex;

            if (wordsYAxisValues[currentWordIndex] > wordsYAxisValues[currentWordIndex - 1]) {
                currentRowIndex += 2;
                textBox.style.top = `-${currentRowIndex}em`;
            }
        }
        else if (keyboardInput.value != currentWord.textContent.substring(0, keyboardInput.value.length)) {
            currentWord.className = 'word current wrong';
        }
        else {
            currentWord.className = 'word current';
        }
    });

    restartBtn.addEventListener('click', _ => {
        window.location.reload();
    });

    timer.addEventListener('click', _ => {
        timer.classList.toggle('hide');
    });

    document.addEventListener('timeover', _ => {
        const wpm = calculateWPM(totalCharsTyped, uncorrectedErrors);
        const accuracy = calculateAccuracy(totalCharsTyped, uncorrectedErrors);
        const stats = {
            wpm: wpm,
            chars: totalCharsTyped,
            errors: uncorrectedErrors,
            correct: totalCorrectWords,
            wrong: totalWrongWords,
            accuracy: accuracy
        }
        console.table(stats);
    });
})();
