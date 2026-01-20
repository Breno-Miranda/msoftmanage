import { db } from './config/database';
import { mAuth } from './models/mAuth';

async function verify() {
    try {
        await db.connect();
        const email = "brenomirandaster@gmail.com";
        const user = await mAuth.findOne({ email }).select('+password');

        if (!user) {
            // User not found
        } else {
            // User found
        }
    } catch (e) {
        // error handling
    } finally {
        process.exit(0);
    }
}

verify();
