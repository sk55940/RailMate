const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Use Google's DNS
dns.resolveSrv('_mongodb._tcp.cluster0.nnfgb2b.mongodb.net', (err, result) => {
    if (err) {
        console.error("SRV Error:", err);
    } else {
        console.log("SRV Result:", JSON.stringify(result));
        
        // Also resolve TXT for the replica set name and auth source
        dns.resolveTxt('cluster0.nnfgb2b.mongodb.net', (err, txtResult) => {
             if (err) console.error("TXT Error:", err);
             else console.log("TXT Result:", JSON.stringify(txtResult));
        });
    }
});
