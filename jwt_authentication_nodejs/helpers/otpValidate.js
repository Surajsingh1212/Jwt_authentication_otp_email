const oneMinuteExpiry = async(otpTime)=>{
        try{
                console.log('Timestamp is:-'+ otpTime)

                const cDateTime = new Date()
                var differenceValue = (otpTime - cDateTime.getTime())/1000
                differenceValue /=60

                console.log('Expiration Time : - '+ Math.abs(differenceValue))

                if(Math.abs(differenceValue)>1){
                    return true
                }
                return false;
        }   
        catch(error){
            console.log(error)
        }
}
const threeMinuteExpiry = async(otpTime)=>{
    try{
            // console.log('Timestamp is:-'+ otpTime)

            const cDateTime = new Date()
            var differenceValue = (otpTime - cDateTime.getTime())/1000
            differenceValue /=60

            // console.log('Expiration Time : - '+ Math.abs(differenceValue))

            if(Math.abs(differenceValue)>3){
                return true
            }
            return false;
    }   
    catch(error){
        console.log(error)
    }
}
module.exports = {
    oneMinuteExpiry,
    threeMinuteExpiry
}