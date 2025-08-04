import { useState } from "react";

const AddMiner = () => {
    const [showForm, setShowForm] = useState(false);
    const [ip, setIp] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ajoute ici la logique pour ajouter la machine avec l'IP
        alert(`Machine ajoutée avec l'IP : ${ip}`);
        setIp("");
        setShowForm(false);
    };

    return (
        <div className="m-16 flex flex-col items-center">
            {!showForm ? (
                <button
                    className="border border-white/40 rounded-xl p-2 bg-white/30 hover:bg-white/40 text-white"
                    onClick={() => setShowForm(true)}
                >
                    Ajouter une machine
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
                    <input
                        type="text"
                        placeholder="Adresse IP"
                        value={ip}
                        onChange={e => setIp(e.target.value)}
                        className="p-2 rounded bg-white/20 text-white border border-white/40"
                        required
                    />
                    <button
                        type="submit"
                        className="border border-white/40 rounded-xl p-2 bg-white/30 hover:bg-white/40 text-white"
                    >
                        Valider
                    </button>
                </form>
            )}
        </div>
    );
};

export default AddMiner;