import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMatching(jsonData) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../python/match.py');
        const pythonPath = path.join(__dirname, '../../venv/bin/python3');
        
        const pythonProcess = spawn(pythonPath, [scriptPath]);
        
        let outputData = '';
        let errorData = '';
        
        pythonProcess.stdin.write(JSON.stringify(jsonData));
        pythonProcess.stdin.end();
        
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });
        
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Python script error:', errorData);
                reject(new Error('Matching process failed'));
            } else {
                try {
                    const result = JSON.parse(outputData);
                    resolve(result);
                } catch (error) {
                    console.error('Failed to parse Python output:', outputData);
                    reject(new Error('Failed to parse matching results'));
                }
            }
        });
        
        pythonProcess.on('error', (error) => {
            console.error('Failed to start Python process:', error);
            reject(new Error('Failed to start matching process'));
        });
    });
}

export default { runMatching };
