const btnArray = [
  "%", "+/-", "AC", "÷",
  "7", "8", "9", "×",
  "4", "5", "6", "-",
  "1", "2", "3", "+",
  "0", "00", ".", "="
];

let buttons = "";

for (let i = 0; i < btnArray.length; i++) {
    buttons += `
    <button
        style="
        height: auto;
        width: auto;
        padding: 6px;
        border: 2px solid black;
        text-align: center;
        "

        onclick='handleButtonClick("${btnArray[i]}")'
    >
        ${btnArray[i]}
    </button>
    `;
}

document.getElementById("parent").innerHTML = buttons;

const input = document.getElementById("input");
const output = document.getElementById("output");

let equation = "";

const handleButtonClick = (btn) => {
    console.log(`Button ${btn}`);

    if (btn === "=" || btn === "AC") {}
    else {
        equation += `${btn} `;
        input.placeholder = equation;
    }

    if (btn === "AC") equation = "";

    if (btn === "=") {
        equation = equation.replaceAll("×", "*");
        equation = equation.replaceAll("÷", "/");
        console.log(equation);
        let answer = eval(equation);
        output.innerText = answer;
        equation = "";
    }
}