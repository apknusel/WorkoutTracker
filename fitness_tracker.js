const connectButton = document.getElementById('connectButton');
const statusDisplay = document.getElementById('status');
const dataDisplay = document.getElementById('data');
const deviceNameInput = document.getElementById('deviceName');

const SERVICE_UUID = 0x1826;
const CHARACTERISTIC_UUID = 0x2AD2;

let bleDevice = null;
let characteristic = null;
let receivedData = [];

connectButton.addEventListener('click', async () => {
    if (bleDevice) {
        disconnect();
        return;
    }
    try {
        // Get the device name from input
        const deviceName = deviceNameInput.value;
        if (!deviceName) {
            alert("Please enter a device name.");
            return;
        }

        // Request the Bluetooth device with specified name and service
        connectButton.textContent = 'Connecting...';
        bleDevice = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: deviceName }],
            optionalServices: [SERVICE_UUID]  // Include the service UUID in optionalServices
        });

        // Connect to GATT server
        const server = await bleDevice.gatt.connect();
        const service = await server.getPrimaryService(SERVICE_UUID);
        characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

        // Set up notifications
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

        connectButton.textContent = 'Disconnect';
        connectButton.classList.add('connected');
    } catch (error) {
        connectButton.textContent = 'Connection Failed';
        console.error('Connection failed!', error);
    }
});

function disconnect() {
    if (!bleDevice) return;
    if (bleDevice.gatt.connected) {
        bleDevice.gatt.disconnect();
        connectButton.textContent = 'Connect';
        connectButton.classList.remove('connected');
    }
    bleDevice = null;
}

function handleCharacteristicValueChanged(event) {
    const value = event.target.value.getUint16(0);
    receivedData.push(value)
    console.log(`Data Received: ${value}`);
    if (receivedData.length === 4) {
        console.log(receivedData);
        updateFields(receivedData[0], receivedData[1], receivedData[2], receivedData[3]);
        receivedData = [];
    }
}

function addExercise() {
    const exerciseDiv = document.createElement('div');
    exerciseDiv.classList.add('exercise');

    exerciseDiv.innerHTML = `
      <input type="text" placeholder="Exercise">
      <input type="number" placeholder="Reps">
      <input type="text" disabled>
      <input type="text" disabled>
      <input type="text" disabled>
      <input type="text" disabled>
      <button onclick="toggleSelect(this)">Select</button>
    `;

    document.getElementById('exercises').appendChild(exerciseDiv);
}

function toggleSelect(button) {
    // Deselect any previously selected button
    const previouslySelected = document.querySelector('.selected');
    if (previouslySelected && previouslySelected !== button) {
        previouslySelected.classList.remove('selected');
        previouslySelected.textContent = 'Select';
    }

    // Toggle the current button
    if (button.classList.contains('selected')) {
        button.classList.remove('selected');
        button.textContent = 'Select';
    } else {
        button.classList.add('selected');
        button.textContent = 'Selected';
    }
}

function updateFields(difficulty, avg_heart_rate, blood_oxygen, time) {
    const selectedButton = document.querySelector('.selected');
    if (!selectedButton) {
        console.error('No exercise selected');
        return;
    }
    const exerciseDiv = selectedButton.parentElement;

    exerciseDiv.children[2].value = `${difficulty}%`;
    exerciseDiv.children[3].value = `${avg_heart_rate}bpm`;
    exerciseDiv.children[4].value = `${blood_oxygen}%`;
    exerciseDiv.children[5].value = formatTime(time);
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}