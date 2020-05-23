var http = require('http');
var https = require('https');

const POLICY_URI = "https://dn8mlk7hdujby.cloudfront.net/interview/insurance/policy";
const CURRENCY = "UF";

var processPolicy = (policy, currency) => {
    console.log("policy:", policy);
    let totalCosts = 0;
    let employeesCopay = [];
    
	policy.workers.forEach(function (worker) {
	    let employeeCost = 0;
	    if(worker.age < 65) {
	        employeeCost += calculateHealthInsurance(worker.childs);
	        if(policy.has_dental_care) {
	            employeeCost += calculateDentalInsurance(worker.childs);
	        }
	        employeesCopay.push(employeeCost * (1 - policy.company_percentage/100));
	        totalCosts += employeeCost;
	    }
	});
	
    return {"currency": currency,
            "total": totalCosts * policy.company_percentage/100,
            "employees_copay": employeesCopay};
};

var calculateHealthInsurance = (numberOfChildren) => {
    if(numberOfChildren < 1) {
        return 0.279;
    } else if (numberOfChildren === 1) {
        return 0.4396;
    } else {
        return 0.5599;
    }
}

var calculateDentalInsurance = (numberOfChildren) => {
    if(numberOfChildren < 1) {
        return 0.12;
    } else if (numberOfChildren === 1) {
        return 0.1950;
    } else {
        return 0.2480;
    }
}
var getPolicy = (uri) => {
    return new Promise((resolve, reject) => {
        https.get(uri, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                resolve(JSON.parse(data).policy);
            });
        })
        .on("error", (err) => {
            reject(err.message);
        });
    });
}

http.createServer()
    .on('request', async (req, res) => {
        try {
            let totalPolicyCosts = processPolicy(await getPolicy(POLICY_URI), CURRENCY);
            
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(totalPolicyCosts));
        } catch (e) {
            console.error("ERROR", e);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end();
        }

    })
    .listen(8080);
