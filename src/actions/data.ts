'use server';

import { Parameter } from "@/lib/types";

// This is a map to store the "current" server-side value for each parameter.
// In a real application, this would be replaced by a database or a real-time data source.
const parameterDataStore = new Map<string, any>();

function initializeParameterData(parameterId: string, displayType: Parameter['displayType']) {
    switch (displayType) {
        case 'line':
        case 'bar':
            // For charts, initialize with an array of data points
            parameterDataStore.set(parameterId, 
                Array.from({ length: 10 }, (_, i) => ({
                    name: `Point ${i + 1}`,
                    value: Math.random() * 80 + 10,
                }))
            );
            break;
        case 'stat':
            // For stats, initialize with a value and a previous value
            const initialValue = Math.random() * 80 + 10;
            parameterDataStore.set(parameterId, {
                value: initialValue,
                previousValue: initialValue,
            });
            break;
        default:
            // For gauges, progress bars, etc.
             parameterDataStore.set(parameterId, Math.random() * 100);
    }
}

function getNextData(parameter: Parameter) {
    const { id, displayType } = parameter;

    if (!parameterDataStore.has(id)) {
        initializeParameterData(id, displayType);
    }

    const currentValue = parameterDataStore.get(id);

    switch (displayType) {
        case 'line':
        case 'bar':
            const newDataSet = [...currentValue];
            const lastValue = newDataSet[newDataSet.length - 1]?.value || 50;
            const change = (Math.random() - 0.5) * 5;
            let newValue = lastValue + change;
            if (newValue < 0) newValue = 0;
            if (newValue > 100) newValue = 100;
            const newDataPoint = { time: (newDataSet[newDataSet.length - 1]?.time || 0) + 1, value: newValue };
            
            newDataSet.push(newDataPoint);
            if (newDataSet.length > 20) {
              newDataSet.shift();
            }
            parameterDataStore.set(id, newDataSet);
            break;
        case 'stat':
             const changeStat = (Math.random() - 0.5) * 10;
             let newStatValue = currentValue.value + changeStat;
             if (newStatValue < 0) newStatValue = 0;
             if (newStatValue > 100) newStatValue = 100;
             parameterDataStore.set(id, { value: newStatValue, previousValue: currentValue.value });
            break;
        default:
             const changeDefault = (Math.random() - 0.5) * 10;
             let newDefaultValue = currentValue + changeDefault;
             if (newDefaultValue < 0) newDefaultValue = 0;
             if (newDefaultValue > 100) newDefaultValue = 100;
             parameterDataStore.set(id, newDefaultValue);
    }
    
    return parameterDataStore.get(id);
}


/**
 * Fetches the latest data for a given parameter.
 * This is a server action that simulates fetching data from a backend service.
 * @param parameter The parameter to fetch data for.
 * @returns The latest data for the parameter.
 */
export async function getLatestParameterData(parameter: Parameter): Promise<any> {
    try {
        // In a real-world scenario, you would fetch data from a database, an IoT device, or an external API.
        // For this demo, we'll generate a new "random" value based on the previous one to simulate real-time changes.
        const data = getNextData(parameter);
        return data;
    } catch (error) {
        console.error(`Failed to fetch data for parameter ${parameter.id}:`, error);
        // In a real app, you might want to return a specific error object.
        return null;
    }
}
