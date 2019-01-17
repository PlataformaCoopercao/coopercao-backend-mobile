import * as functions from 'firebase-functions';
import {
    auth,
    db
} from '../db/index';



export const registerClient = functions.https.onRequest((request, response) => {

    if (request.method !== "POST") {
        response.status(400).send("Error");
        // return 0
    }

    const email = request.body.email;
    const pass = request.body.pass;
    const phoneNumber = request.body.phoneNumber;
    const name = request.body.name;
    const photoUrl = request.body.photoUrl;
    const birth_date = request.body.birth_date;
    const cpf = request.body.cpf;
    const address = request.body.address;

    auth.createUser({
            email: email,
            emailVerified: false,
            phoneNumber: phoneNumber,
            password: pass,
            displayName: name,
            photoURL: photoUrl,
            disabled: false
        })
        .then(userRecord => {
            // See the UserRecord reference doc for the contents of userRecord.
            console.log("Successfully created new user:", userRecord.uid);
            return db.ref('clients/' + userRecord.uid).set({
                name: name,
                birth_date: birth_date,
                cpf: cpf,
                phoneNumber: phoneNumber,
                photoURL: photoUrl,
                email: email,
                address: {
                    cep: address.cep,
                    street: address.street,
                    num: address.num,
                    compl: address.compl,
                    district : address.district
                }
            })
        })
        .then(() => {
            response.status(200).send("Successfully created new user profile");
        })
        .catch(function (error) {
            console.log("Error creating new user:", error);
            response.status(400).send(error)
        });
});

export const updateClient = functions.https.onRequest((request, response) => {

    const uid = request.body.uid;
    const client = request.body.client;

    db.ref('clients/' + uid).update(client)
    .then(() => {
        response.status(200).send('user updated succesfully');
    })
    .catch(error => {
        response.status(400).send(error);
    })


    // auth.verifyIdToken(request.body.token)
    //     .then(decodedToken => {
    //         const uid = decodedToken.uid;
    //         let clientRef =  db.ref('clients/' + uid);
    //         clientRef.update(request.body)
    //         response.status(200).send('user updated succesfully');
    //     })
    //     .catch(error => {
    //         response.status(400).send(error);
    //     })
})

export const getAllClients = functions.https.onRequest((request, response) =>{
    response.set('Access-Control-Allow-Origin','*');
    response.set('Access-Controll-Allow-Methods','GET');

    db.ref('clients').once('value', snapshot =>{
        const clientList = [];
        snapshot.forEach((childSnapshot =>{
            clientList.push(childSnapshot);
        }))
        response.status(200).send(clientList)
    })
    .catch(error => {
        response.status(400).send(error);
    })
})

export const getClient = functions.https.onRequest((request, response) => {

    const uid = request.body.uid;
    db.ref('clients/' + uid)
        .once('value', snapshot => {
            response.status(200).send(snapshot.val());
        })
        .catch(error => {
            response.status(400).send(error);
        })

    // auth.verifyIdToken(request.body.token)
    //     .then(decodedToken => {
    //         const uid = decodedToken.uid;
    //         db.ref('clients/' + uid).once('value', snapshot => {
    //             response.status(200).send(snapshot.val());
    //         })
    //     })
    //     .catch(error => {
    //         response.status(400).send(error);
    //     })

});

export const getPasseiosAgendados = functions.https.onRequest((request, response) => {
    //RETORNA UM [[X], [Y]] ONDE X SÃO OS PASSEIOS AGENDADOS COM PASSEADORES ALOCADOS E Y SÃO OS SEM PASSEADORES ALOCADOS
    //firebase serve --only functions
    if (request.method !== "POST") {
        response.status(400).send("Error");
        // return 0
    }
    const ownerKey = request.body.ownerKey;
    const data:any[] = [];

    db.ref('walk_assigned').orderByChild('dog/owner').equalTo(ownerKey).once('value')
    .then(snapshot => {
        const assigned_walks = [];
        snapshot.forEach((childSnapshot => {
            const childData = childSnapshot.val();
            assigned_walks.push(childData);
        }))
        data[0] = assigned_walks;
    })
    .catch(error =>{
        response.status(400).send(error);
    })
    db.ref('walk_unassigned').orderByChild('dog/owner').equalTo(ownerKey).once('value')
    .then(snapshot => {
        const unassigned_walks = [];
        snapshot.forEach((childSnapshot => {
            const childData = childSnapshot.val();
            unassigned_walks.push(childData);
        }))
        data[1] = unassigned_walks;
        response.send(data);
    })
    .catch(error =>{
        response.status(400).send(error);
    })
});

//envia {"ownerKey": } 
export const getHistoricoCliente = functions.https.onRequest((request, response) => {
    if (request.method !== "POST") {
        response.status(400).send("Error");
        // return 0
    }
    const ownerKey = request.body.ownerKey;

    db.ref('walk_history').orderByChild('dog/owner').equalTo(ownerKey).once('value')
    .then(snapshot => {
        const walks = [];
        snapshot.forEach((childSnapshot => {
            const childData = childSnapshot.val();
            walks.push(childData);
        }))
        response.status(200).send(walks);
    })
    .catch(error =>{
        response.status(400).send(error);
    })
});

export const getFaturaMensalCliente = functions.https.onRequest((request, response) => {
    if (request.method !== "POST") {
        response.status(400).send("Error");
    }
    const ownerKey = request.body.ownerKey;
    const mes = request.body.mes;
    const ano = request.body.ano;
  

    db.ref('walk_history').orderByChild("owner:month:year").equalTo(ownerKey+":"+mes+":"+ano).once('value')
    .then(snapshot => {
        let pagamentosAvulsos = 0;
        let pagamentosPlano = 0;
        snapshot.forEach((childSnapshot => {
            const childData = childSnapshot.val();
            if(childData.walk_type === 'separate'){
                pagamentosAvulsos += childData.value;
            }else{
                pagamentosPlano += childData.value;
            }
        }))
        response.status(200).send({pagamentosAvulsos,pagamentosPlano});
    })
    .catch(error =>{
        response.status(400).send(error);
    })
});