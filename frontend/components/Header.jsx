const Header = () => {
    return (
        <div className="p-8 flex mb-6 text-white items-baseline justify-between border-b border-white/40">
            <h2 className="font-semibold text-xl">MineOps</h2>
            <div className="flex gap-12 mx-auto underline">
                <p>Accueil</p>
                <p>Terminal</p>
            </div>
            
        </div>
    );
}

export default Header;