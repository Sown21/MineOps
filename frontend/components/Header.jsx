import Link from 'next/link';

const Header = () => {
    return (
        <div className="glass-card p-6 m-4 mb-8">
            <div className="flex items-center justify-between">
                <Link href="/">
                    <h1 className="font-bold text-2xl text-white hover:text-blue-300 transition-colors duration-200">
                        MineOps
                    </h1>
                </Link>
                
                <nav className="flex gap-8">
                    <Link href="/dashboard" className="text-white/90 hover:text-white underline transition-colors duration-200">
                        Dashboard
                    </Link>
                    <Link href="/terminal" className="text-white/90 hover:text-white underline transition-colors duration-200">
                        Terminal
                    </Link>
                </nav>
            </div>
        </div>
    );
}

export default Header;