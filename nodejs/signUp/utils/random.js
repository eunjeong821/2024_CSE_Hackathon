const generate4DigitRandom = () => {
    const min = 1000;
    const max = 9999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
    //return 1234;
  };
  
  export default generate4DigitRandom;
  