let actionSequence = 0; 

export const getActionSequence = () => {
    return actionSequence; 
}

export const updateActionSequence = () => {
    actionSequence++; 
}